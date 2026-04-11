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
import { PayloadCompositionRepository } from "@repo/infrastructure-persistence";
import { err } from "@repo/kernel";
import type { MiddlewareHandler } from "hono";
import { Hono } from "hono";
import type { TypedUser } from "payload";
import { z } from "zod";

import { logCatalogActivity } from "../lib/catalog-activity-log.js";
import { resultToResponse } from "../lib/result-to-response.js";
import { getPayloadInstance } from "../payload.js";

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

/** Shared composition HTTP API — used by designer builder and editor composer (different auth middleware). */
export function createCompositionMutationRouter(middleware: MiddlewareHandler) {
  const r = new Hono();
  r.use(middleware);

  r.get("/compositions/:id", async (c) => {
    const payload = await getPayloadInstance();
    const repo = new PayloadCompositionRepository(payload);
    const id = c.req.param("id");
    const actor = c.get("actor");
    const loaded = await getCompositionQuery(repo, {
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
    const payload = await getPayloadInstance();
    const repo = new PayloadCompositionRepository(payload);
    const id = c.req.param("id");
    const result = await addNodeCommand(repo, {
      compositionId: id,
      parentId: body.data.parentId,
      definitionKey: body.data.definitionKey,
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.delete("/compositions/:id/nodes/:nodeId", async (c) => {
    const payload = await getPayloadInstance();
    const repo = new PayloadCompositionRepository(payload);
    const result = await removeNodeCommand(repo, {
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
    const payload = await getPayloadInstance();
    const repo = new PayloadCompositionRepository(payload);
    const result = await updateNodePropsCommand(repo, {
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
    const payload = await getPayloadInstance();
    const repo = new PayloadCompositionRepository(payload);
    const result = await updateNodeStyleCommand(repo, {
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
    const payload = await getPayloadInstance();
    const repo = new PayloadCompositionRepository(payload);
    const result = await saveDraftCommand(repo, {
      compositionId: c.req.param("id"),
      composition: body.data.composition,
      ifMatchUpdatedAt: body.data.ifMatchUpdatedAt,
      actor: c.get("actor"),
    });
    return resultToResponse(c, result);
  });

  r.post("/compositions/:id/submit", async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const result = await submitForCatalogCommand(
      {
        trySubmit: async (compositionId, a) => {
          try {
            const existing = await payload.findByID({
              collection: "page-compositions",
              id: compositionId,
              depth: 0,
              draft: true,
              user: a as TypedUser,
              overrideAccess: false,
            });
            if (!existing) {
              return {
                ok: false as const,
                error: "COMPOSITION_NOT_FOUND" as const,
              };
            }
            const submittedAt = new Date().toISOString();
            await payload.update({
              collection: "page-compositions",
              id: compositionId,
              data: {
                catalogSubmittedAt: submittedAt,
                catalogReviewStatus: "submitted",
              },
              draft: true,
              user: a as TypedUser,
              overrideAccess: false,
            });
            await logCatalogActivity(payload, {
              resourceType: "pageComposition",
              resourceId: compositionId,
              action: "submit",
              actorId: (a as { id: unknown }).id as string | number,
            });
            return { ok: true as const, submittedAt: submittedAt };
          } catch (e) {
            const name =
              typeof e === "object" && e !== null && "name" in e
                ? String((e as { name: unknown }).name)
                : "";
            if (name === "Forbidden" || name === "ForbiddenError") {
              return { ok: false as const, error: "FORBIDDEN" as const };
            }
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
    const payload = await getPayloadInstance();
    const id = c.req.param("id");
    const actor = c.get("actor") as TypedUser;
    const since = new Date(Date.now() - PRESENCE_MAX_AGE_MS);
    const found = await payload.find({
      collection: "composition-presence",
      where: {
        and: [
          { composition: { equals: id } },
          { updatedAt: { greater_than: since.toISOString() } },
          { holder: { not_equals: actor.id } },
        ],
      },
      depth: 1,
      limit: 20,
      user: actor,
      overrideAccess: false,
    });
    const others = found.docs.map((doc) => {
      const h = doc.holder;
      const userId =
        typeof h === "object" && h !== null && "id" in h
          ? String((h as { id: unknown }).id)
          : "";
      const email =
        typeof h === "object" && h !== null && "email" in h
          ? String((h as { email?: unknown }).email ?? "")
          : "";
      return { userId, email };
    });
    return c.json({ data: { others } });
  });

  r.post("/compositions/:id/presence", async (c) => {
    const payload = await getPayloadInstance();
    const id = c.req.param("id");
    const actor = c.get("actor") as TypedUser;
    const existing = await payload.find({
      collection: "composition-presence",
      where: {
        and: [
          { composition: { equals: id } },
          { holder: { equals: actor.id } },
        ],
      },
      limit: 1,
      user: actor,
      overrideAccess: false,
    });
    if (existing.docs[0]) {
      await payload.update({
        collection: "composition-presence",
        id: String(existing.docs[0].id),
        data: {},
        user: actor,
        overrideAccess: false,
      });
    } else {
      await payload.create({
        collection: "composition-presence",
        data: {
          composition: id,
          holder: actor.id,
        },
        user: actor,
        overrideAccess: false,
      });
    }
    return c.json({ data: { ok: true as const } });
  });

  r.delete("/compositions/:id/presence", async (c) => {
    const payload = await getPayloadInstance();
    const id = c.req.param("id");
    const actor = c.get("actor") as TypedUser;
    const existing = await payload.find({
      collection: "composition-presence",
      where: {
        and: [
          { composition: { equals: id } },
          { holder: { equals: actor.id } },
        ],
      },
      limit: 1,
      user: actor,
      overrideAccess: false,
    });
    if (existing.docs[0]) {
      await payload.delete({
        collection: "composition-presence",
        id: String(existing.docs[0].id),
        user: actor,
        overrideAccess: false,
      });
    }
    return c.json({ data: { ok: true as const } });
  });

  return r;
}
