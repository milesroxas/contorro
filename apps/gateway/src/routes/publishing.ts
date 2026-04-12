import {
  approveComponentRevisionCommand,
  publishRevisionToDefinitionCommand,
  rollbackDefinitionFromRevisionCommand,
  submitComponentRevisionCommand,
} from "@repo/application-publish-flow";
import {
  breakingChangePublishAllowed,
  makePublishJobIdempotencyKey,
} from "@repo/application-publish-flow";
import {
  resolveEditorSlotContractForDefinition,
  slotContractBreakingChanges,
} from "@repo/domains-composition";
import { err } from "@repo/kernel";
import { Hono } from "hono";

import { resultToResponse } from "../lib/result-to-response.js";
import { designerSessionMiddleware } from "../middleware/designer-session.js";
import type { GatewayActor } from "../runtime/auth.js";
import { logCatalogActivitySql } from "../runtime/catalog-log.js";
import { pool } from "../runtime/db.js";

/** §8.2 — /api/gateway/publishing — Postgres via shared pool (no Payload in gateway). */
export const publishingRouter = new Hono();

publishingRouter.post(
  "/revisions/:id/submit",
  designerSessionMiddleware,
  async (c) => {
    const actor = c.get("actor") as GatewayActor;
    const revisionId = c.req.param("id");

    const result = await submitComponentRevisionCommand(
      {
        trySubmit: async (id, user) => {
          void user;
          try {
            const q = await pool.query<{
              status: string;
            }>("select status from component_revisions where id = $1", [
              Number.parseInt(id, 10),
            ]);
            const rev = q.rows[0];
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const status = rev.status ?? "draft";
            if (status !== "draft") {
              return {
                ok: false as const,
                error: "INVALID_STATE" as const,
              };
            }
            await pool.query(
              `update component_revisions set status = 'submitted', updated_at = now() where id = $1`,
              [Number.parseInt(id, 10)],
            );
            await logCatalogActivitySql(pool, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "submit",
              actorId: actor.id,
            });
            return { ok: true as const };
          } catch {
            return {
              ok: false as const,
              error: "PERSISTENCE_ERROR" as const,
            };
          }
        },
      },
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/approve",
  designerSessionMiddleware,
  async (c) => {
    const actor = c.get("actor") as GatewayActor;
    const revisionId = c.req.param("id");

    const result = await approveComponentRevisionCommand(
      {
        tryApprove: async (id, user) => {
          void user;
          try {
            const q = await pool.query<{
              status: string;
            }>("select status from component_revisions where id = $1", [
              Number.parseInt(id, 10),
            ]);
            const rev = q.rows[0];
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const status = rev.status ?? "draft";
            if (status === "published") {
              return {
                ok: true as const,
                status: "approved" as const,
              };
            }
            if (status !== "submitted") {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }
            await pool.query(
              `update component_revisions set status = 'approved', updated_at = now() where id = $1`,
              [Number.parseInt(id, 10)],
            );
            await logCatalogActivitySql(pool, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "approve",
              actorId: actor.id,
            });
            return {
              ok: true as const,
              status: "approved" as const,
            };
          } catch {
            return {
              ok: false as const,
              error: "PERSISTENCE_ERROR" as const,
            };
          }
        },
      },
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/publish",
  designerSessionMiddleware,
  async (c) => {
    const actor = c.get("actor") as GatewayActor;
    const revisionId = c.req.param("id");

    const result = await publishRevisionToDefinitionCommand(
      {
        tryPublish: async (id, user) => {
          void user;
          try {
            const q = await pool.query<{
              status: string;
              is_breaking_change: boolean | null;
              dependency_impact_acknowledged_at: Date | string | null;
              prop_contract: unknown;
              slot_contract: unknown;
              composition: unknown;
              definition_id: number;
              updated_at: Date | string;
            }>(
              `select status, is_breaking_change, dependency_impact_acknowledged_at,
                      prop_contract, slot_contract, composition, definition_id, updated_at
               from component_revisions where id = $1`,
              [Number.parseInt(id, 10)],
            );
            const rev = q.rows[0];
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const status = rev.status ?? "draft";
            if (status !== "approved") {
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            let defRow:
              | { composition: unknown; slot_contract: unknown }
              | undefined;
            try {
              const defQ = await pool.query<{
                composition: unknown;
                slot_contract: unknown;
              }>(
                "select composition, slot_contract from component_definitions where id = $1",
                [Number.parseInt(String(rev.definition_id), 10)],
              );
              defRow = defQ.rows[0];
            } catch {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }
            const prevResolved = resolveEditorSlotContractForDefinition({
              composition: defRow?.composition,
              slotContract: defRow?.slot_contract,
            });
            const prevSlots = prevResolved.ok
              ? prevResolved.contract.slots
              : [];
            const nextResolved = resolveEditorSlotContractForDefinition({
              composition: rev.composition,
              slotContract: rev.slot_contract,
            });
            const nextSlots = nextResolved.ok
              ? nextResolved.contract.slots
              : [];
            const slotBreaking =
              slotContractBreakingChanges(prevSlots, nextSlots).length > 0;
            const isBreaking = slotBreaking || Boolean(rev.is_breaking_change);
            const ackAt = rev.dependency_impact_acknowledged_at;
            const ackStr =
              ackAt instanceof Date
                ? ackAt.toISOString()
                : typeof ackAt === "string"
                  ? ackAt
                  : undefined;
            if (!breakingChangePublishAllowed(isBreaking, ackStr ?? null)) {
              return {
                ok: false as const,
                error: "BREAKING_CHANGE_NOT_ACKNOWLEDGED" as const,
              };
            }
            const revUpdated =
              rev.updated_at instanceof Date
                ? rev.updated_at.toISOString()
                : String(rev.updated_at ?? id);
            const idempotencyKey = makePublishJobIdempotencyKey({
              scope: "component_revision_publish",
              targetId: String(id),
              intentId: revUpdated,
            });

            const dup = await pool.query(
              `select id from publish_jobs where idempotency_key = $1 and status = 'succeeded' limit 1`,
              [idempotencyKey],
            );
            if (dup.rows.length > 0) {
              return { ok: true as const };
            }

            const ins = await pool.query<{ id: number }>(
              `insert into publish_jobs (idempotency_key, kind, status, target_revision_id, updated_at, created_at)
               values ($1, 'component_revision_publish', 'pending', $2, now(), now())
               returning id`,
              [idempotencyKey, Number.parseInt(id, 10)],
            );
            const jobId = ins.rows[0]?.id;
            if (jobId === undefined) {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }

            const defId = String(rev.definition_id);
            if (!defId) {
              await pool.query(
                `update publish_jobs set status = 'failed', error_message = $1 where id = $2`,
                ["missing definition", jobId],
              );
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            const propContract = rev.prop_contract;
            const slotRaw = rev.slot_contract;
            if (propContract === undefined || propContract === null) {
              await pool.query(
                `update publish_jobs set status = 'failed', error_message = $1 where id = $2`,
                ["missing prop contract", jobId],
              );
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            const publishedSlots = resolveEditorSlotContractForDefinition({
              composition: rev.composition,
              slotContract: slotRaw,
            });
            if (!publishedSlots.ok) {
              await pool.query(
                `update publish_jobs set status = 'failed', error_message = $1 where id = $2`,
                ["invalid slot contract", jobId],
              );
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            const resolvedSlotContract = publishedSlots.contract;
            const compositionJson =
              rev.composition === undefined || rev.composition === null
                ? null
                : JSON.stringify(rev.composition);
            await pool.query(
              `update component_definitions
               set prop_contract = $1::jsonb,
                   slot_contract = $2::jsonb,
                   composition = $3::jsonb,
                   visible_in_editor_catalog = true,
                   updated_at = now()
               where id = $4`,
              [
                JSON.stringify(propContract),
                JSON.stringify(resolvedSlotContract),
                compositionJson,
                Number.parseInt(defId, 10),
              ],
            );
            await pool.query(
              `update component_revisions set status = 'published', updated_at = now() where id = $1`,
              [Number.parseInt(id, 10)],
            );
            await pool.query(
              `update publish_jobs set status = 'succeeded', updated_at = now() where id = $1`,
              [jobId],
            );
            await logCatalogActivitySql(pool, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "publish",
              actorId: actor.id,
              metadata: { definitionId: defId },
            });
            return { ok: true as const };
          } catch {
            return {
              ok: false as const,
              error: "PERSISTENCE_ERROR" as const,
            };
          }
        },
      },
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/rollback",
  designerSessionMiddleware,
  async (c) => {
    const actor = c.get("actor") as GatewayActor;
    const revisionId = c.req.param("id");

    const result = await rollbackDefinitionFromRevisionCommand(
      {
        tryRollback: async (id, user) => {
          void user;
          try {
            const q = await pool.query<{
              prop_contract: unknown;
              slot_contract: unknown;
              composition: unknown;
              definition_id: number;
            }>(
              "select prop_contract, slot_contract, composition, definition_id from component_revisions where id = $1",
              [Number.parseInt(id, 10)],
            );
            const rev = q.rows[0];
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const defId = String(rev.definition_id);
            const propContract = rev.prop_contract;
            const slotRaw = rev.slot_contract;
            if (propContract === undefined || propContract === null) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const rolledBackSlots = resolveEditorSlotContractForDefinition({
              composition: rev.composition,
              slotContract: slotRaw,
            });
            if (!rolledBackSlots.ok) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const resolvedSlotContract = rolledBackSlots.contract;
            const compositionJson =
              rev.composition === undefined || rev.composition === null
                ? null
                : JSON.stringify(rev.composition);
            await pool.query(
              `update component_definitions
               set prop_contract = $1::jsonb,
                   slot_contract = $2::jsonb,
                   composition = $3::jsonb,
                   updated_at = now()
               where id = $4`,
              [
                JSON.stringify(propContract),
                JSON.stringify(resolvedSlotContract),
                compositionJson,
                Number.parseInt(defId, 10),
              ],
            );
            await logCatalogActivitySql(pool, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "rollback",
              actorId: actor.id,
              metadata: { definitionId: defId },
            });
            return { ok: true as const };
          } catch {
            return {
              ok: false as const,
              error: "PERSISTENCE_ERROR" as const,
            };
          }
        },
      },
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/acknowledge-impact",
  designerSessionMiddleware,
  async (c) => {
    const revisionId = c.req.param("id");
    try {
      const q = await pool.query<{ status: string }>(
        "select status from component_revisions where id = $1",
        [Number.parseInt(revisionId, 10)],
      );
      const rev = q.rows[0];
      if (!rev) {
        return resultToResponse(c, err("REVISION_NOT_FOUND"));
      }
      if (rev.status !== "approved") {
        return resultToResponse(c, err("INVALID_STATE"));
      }
      await pool.query(
        "update component_revisions set dependency_impact_acknowledged_at = now(), updated_at = now() where id = $1",
        [Number.parseInt(revisionId, 10)],
      );
      return c.json({
        data: { acknowledged: true as const },
      });
    } catch {
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }
  },
);
