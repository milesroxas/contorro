import {
  addNodeCommand,
  getCompositionQuery,
  removeNodeCommand,
  saveDraftCommand,
  submitForCatalogCommand,
  updateNodePropsCommand,
  updateNodeStyleCommand,
} from "@repo/application-builder";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { DrizzleCompositionRepository } from "@repo/infrastructure-persistence";
import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import { z } from "zod";

import { resultToResponse } from "../lib/result-to-response.js";
import type { GatewayActor } from "../runtime/auth.js";
import { logCatalogActivitySql } from "../runtime/catalog-log.js";
import { builderDb, pool } from "../runtime/db.js";

/** Presence entries older than this are ignored (Phase 6 soft lock). */
const PRESENCE_MAX_AGE_MS = 120_000;

const addNodeBody = z.object({
  parentId: z.string(),
  definitionKey: z.string(),
});

const updatePropsBody = z.object({
  propValues: z.record(z.string(), z.unknown()),
});

const updateStyleBody = z.object({
  property: z.string(),
  token: z.string(),
});

const saveDraftBody = z.object({
  composition: PageCompositionSchema,
  ifMatchUpdatedAt: z.string().nullable().optional(),
});

/** Shared composition HTTP API — designer builder (`/api/gateway/builder`). */
export function createCompositionMutationRouter(middleware: MiddlewareHandler) {
  const r = new Hono();
  r.use(middleware);

  const repo = () => new DrizzleCompositionRepository(builderDb);

  r.get("/compositions/:id", async (c) => {
    const id = c.req.param("id");
    const actor = c.get("actor");
    const loaded = await getCompositionQuery(repo(), {
      compositionId: id,
      actor,
    });
    if (!loaded) {
      return resultToResponse(c, err("COMPOSITION_NOT_FOUND"));
    }
    return c.json({
      data: {
        composition: loaded.composition,
        updatedAt: loaded.updatedAt,
      },
    });
  });

  r.post("/compositions/:id/nodes", async (c) => {
    const raw = await c.req.json();
    const body = addNodeBody.safeParse(raw);
    if (!body.success) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    const id = c.req.param("id");
    const result = await addNodeCommand(repo(), {
      compositionId: id,
      parentId: body.data.parentId,
      definitionKey: body.data.definitionKey,
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.delete("/compositions/:id/nodes/:nodeId", async (c) => {
    const result = await removeNodeCommand(repo(), {
      compositionId: c.req.param("id"),
      nodeId: c.req.param("nodeId"),
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.patch("/compositions/:id/nodes/:nodeId", async (c) => {
    const raw = await c.req.json();
    const body = updatePropsBody.safeParse(raw);
    if (!body.success) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    const result = await updateNodePropsCommand(repo(), {
      compositionId: c.req.param("id"),
      nodeId: c.req.param("nodeId"),
      patch: body.data.propValues,
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.patch("/compositions/:id/nodes/:nodeId/style", async (c) => {
    const raw = await c.req.json();
    const body = updateStyleBody.safeParse(raw);
    if (!body.success) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    const result = await updateNodeStyleCommand(repo(), {
      compositionId: c.req.param("id"),
      nodeId: c.req.param("nodeId"),
      property: body.data.property,
      token: body.data.token,
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.post("/compositions/:id/draft", async (c) => {
    const raw = await c.req.json();
    const body = saveDraftBody.safeParse(raw);
    if (!body.success) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    const result = await saveDraftCommand(repo(), {
      compositionId: c.req.param("id"),
      composition: body.data.composition,
      ifMatchUpdatedAt: body.data.ifMatchUpdatedAt,
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.post("/compositions/:id/submit", async (c) => {
    const actor = c.get("actor") as GatewayActor;
    const result = await submitForCatalogCommand(
      {
        trySubmit: async (compositionId, a) => {
          void a;
          try {
            const q = await pool.query<{ id: string }>(
              "select id::text as id from builder.compositions where id = $1",
              [compositionId],
            );
            if (q.rows.length === 0) {
              return {
                ok: false as const,
                error: "COMPOSITION_NOT_FOUND" as const,
              };
            }
            const submittedAt = new Date().toISOString();
            await pool.query(
              `update builder.compositions
               set catalog_submitted_at = $1::timestamptz,
                   catalog_review_status = 'submitted',
                   updated_at = now()
               where id = $2`,
              [submittedAt, compositionId],
            );
            await logCatalogActivitySql(pool, {
              resourceType: "pageComposition",
              resourceId: compositionId,
              action: "submit",
              actorId: actor.id,
            });
            return { ok: true as const, submittedAt };
          } catch {
            return {
              ok: false as const,
              error: "PERSISTENCE_ERROR" as const,
            };
          }
        },
      },
      { compositionId: c.req.param("id"), actor },
    );
    return resultToResponse(c, result);
  });

  r.get("/compositions/:id/presence", async (c) => {
    const id = c.req.param("id");
    const actor = c.get("actor") as GatewayActor;
    const since = new Date(Date.now() - PRESENCE_MAX_AGE_MS);
    const compId = Number.parseInt(id, 10);
    if (!Number.isFinite(compId)) {
      return c.json({ data: { others: [] } });
    }
    const found = await pool.query<{ user_id: string; email: string }>(
      `select u.id::text as user_id, u.email as email
       from composition_presence cp
       join users u on u.id = cp.holder_id
       where cp.composition_id = $1
         and cp.updated_at > $2::timestamptz
         and cp.holder_id <> $3`,
      [compId, since.toISOString(), actor.id],
    );
    const others = found.rows.map((row) => ({
      userId: row.user_id,
      email: row.email,
    }));
    return c.json({ data: { others } });
  });

  r.post("/compositions/:id/presence", async (c) => {
    const id = c.req.param("id");
    const actor = c.get("actor") as GatewayActor;
    const compId = Number.parseInt(id, 10);
    if (!Number.isFinite(compId)) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    const existing = await pool.query<{ id: number }>(
      `select id from composition_presence
       where composition_id = $1 and holder_id = $2 limit 1`,
      [compId, actor.id],
    );
    if (existing.rows[0]) {
      await pool.query(
        "update composition_presence set updated_at = now() where id = $1",
        [existing.rows[0].id],
      );
    } else {
      await pool.query(
        `insert into composition_presence (composition_id, holder_id, updated_at, created_at)
         values ($1, $2, now(), now())`,
        [compId, actor.id],
      );
    }
    return c.json({ data: { ok: true as const } });
  });

  r.delete("/compositions/:id/presence", async (c) => {
    const id = c.req.param("id");
    const actor = c.get("actor") as GatewayActor;
    const compId = Number.parseInt(id, 10);
    if (!Number.isFinite(compId)) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }
    await pool.query(
      "delete from composition_presence where composition_id = $1 and holder_id = $2",
      [compId, actor.id],
    );
    return c.json({ data: { ok: true as const } });
  });

  return r;
}
