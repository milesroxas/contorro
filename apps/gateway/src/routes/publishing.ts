import {
  approveComponentRevisionCommand,
  publishRevisionToDefinitionCommand,
  rollbackDefinitionFromRevisionCommand,
  submitComponentRevisionCommand,
} from "@repo/application-page-composer";
import {
  breakingChangePublishAllowed,
  makePublishJobIdempotencyKey,
} from "@repo/application-publish-flow";
import { SlotContractSchema } from "@repo/contracts-zod";
import { err } from "@repo/kernel";
import { Hono } from "hono";
import type { TypedUser } from "payload";

import { logCatalogActivity } from "../lib/catalog-activity-log.js";
import { resultToResponse } from "../lib/result-to-response.js";
import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { getPayloadInstance } from "../payload.js";

function definitionIdFromRevision(rev: { definition?: unknown }):
  | string
  | null {
  const def = rev.definition;
  if (typeof def === "object" && def !== null && "id" in def) {
    const id = (def as { id: unknown }).id;
    if (id !== undefined && id !== null) {
      return String(id);
    }
  }
  if (typeof def === "string" || typeof def === "number") {
    return String(def);
  }
  return null;
}

/** §8.2 — /api/gateway/publishing */
export const publishingRouter = new Hono();

publishingRouter.post(
  "/revisions/:id/submit",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const revisionId = c.req.param("id");

    const result = await submitComponentRevisionCommand(
      {
        trySubmit: async (id, user) => {
          try {
            const rev = await payload.findByID({
              collection: "component-revisions",
              id,
              depth: 0,
              user: user as TypedUser,
              overrideAccess: false,
            });
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const status =
              typeof rev.status === "string" ? rev.status : "draft";
            if (status !== "draft") {
              return {
                ok: false as const,
                error: "INVALID_STATE" as const,
              };
            }
            await payload.update({
              collection: "component-revisions",
              id,
              data: { status: "submitted" },
              user: user as TypedUser,
              overrideAccess: false,
            });
            await logCatalogActivity(payload, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "submit",
              actorId: (user as { id: unknown }).id as string | number,
            });
            return { ok: true as const };
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
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/approve",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const revisionId = c.req.param("id");

    const result = await approveComponentRevisionCommand(
      {
        tryApprove: async (id, user) => {
          try {
            const rev = await payload.findByID({
              collection: "component-revisions",
              id,
              depth: 0,
              user: user as TypedUser,
              overrideAccess: false,
            });
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const status =
              typeof rev.status === "string" ? rev.status : "draft";
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
            await payload.update({
              collection: "component-revisions",
              id,
              data: { status: "approved" },
              user: user as TypedUser,
              overrideAccess: false,
            });
            await logCatalogActivity(payload, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "approve",
              actorId: (user as { id: unknown }).id as string | number,
            });
            return {
              ok: true as const,
              status: "approved" as const,
            };
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
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/publish",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const revisionId = c.req.param("id");

    const result = await publishRevisionToDefinitionCommand(
      {
        tryPublish: async (id, user) => {
          try {
            const rev = await payload.findByID({
              collection: "component-revisions",
              id,
              depth: 1,
              user: user as TypedUser,
              overrideAccess: false,
            });
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const status =
              typeof rev.status === "string" ? rev.status : "draft";
            if (status !== "approved") {
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            const isBreaking = Boolean(
              (rev as { isBreakingChange?: unknown }).isBreakingChange,
            );
            const ackAt = (rev as { dependencyImpactAcknowledgedAt?: unknown })
              .dependencyImpactAcknowledgedAt;
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
            const rRow = rev as unknown as { updatedAt?: unknown };
            const revUpdated =
              rRow.updatedAt instanceof Date
                ? rRow.updatedAt.toISOString()
                : String(rRow.updatedAt ?? id);
            const idempotencyKey = makePublishJobIdempotencyKey({
              scope: "component_revision_publish",
              targetId: String(id),
              intentId: revUpdated,
            });

            const existing = await payload.find({
              collection: "publish-jobs",
              limit: 1,
              depth: 0,
              where: {
                and: [
                  { idempotencyKey: { equals: idempotencyKey } },
                  { status: { equals: "succeeded" } },
                ],
              },
              overrideAccess: true,
            });
            if (existing.docs.length > 0) {
              return { ok: true as const };
            }

            const job = await payload.create({
              collection: "publish-jobs",
              data: {
                idempotencyKey,
                kind: "component_revision_publish",
                status: "pending",
                targetRevision: String(id),
              },
              overrideAccess: true,
            });

            const defId = definitionIdFromRevision(
              rev as { definition?: unknown },
            );
            if (!defId) {
              await payload.update({
                collection: "publish-jobs",
                id: String(job.id),
                data: {
                  status: "failed",
                  errorMessage: "missing definition",
                },
                overrideAccess: true,
              });
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            const propContract = (rev as { propContract?: unknown })
              .propContract;
            const slotRaw = (rev as { slotContract?: unknown }).slotContract;
            if (propContract === undefined || propContract === null) {
              await payload.update({
                collection: "publish-jobs",
                id: String(job.id),
                data: {
                  status: "failed",
                  errorMessage: "missing prop contract",
                },
                overrideAccess: true,
              });
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            const slotParsed = SlotContractSchema.safeParse(
              slotRaw ?? { slots: {} },
            );
            if (!slotParsed.success) {
              await payload.update({
                collection: "publish-jobs",
                id: String(job.id),
                data: {
                  status: "failed",
                  errorMessage: "invalid slot contract",
                },
                overrideAccess: true,
              });
              return { ok: false as const, error: "INVALID_STATE" as const };
            }
            await payload.update({
              collection: "component-definitions",
              id: defId,
              data: {
                propContract,
                slotContract: slotParsed.data,
              },
              user: user as TypedUser,
              overrideAccess: false,
            });
            await payload.update({
              collection: "component-revisions",
              id,
              data: { status: "published" },
              user: user as TypedUser,
              overrideAccess: false,
            });
            await payload.update({
              collection: "publish-jobs",
              id: String(job.id),
              data: { status: "succeeded" },
              overrideAccess: true,
            });
            await logCatalogActivity(payload, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "publish",
              actorId: (user as { id: unknown }).id as string | number,
              metadata: { definitionId: defId },
            });
            return { ok: true as const };
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
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/rollback",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const revisionId = c.req.param("id");

    const result = await rollbackDefinitionFromRevisionCommand(
      {
        tryRollback: async (id, user) => {
          try {
            const rev = await payload.findByID({
              collection: "component-revisions",
              id,
              depth: 1,
              user: user as TypedUser,
              overrideAccess: false,
            });
            if (!rev) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const defId = definitionIdFromRevision(
              rev as { definition?: unknown },
            );
            if (!defId) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const propContract = (rev as { propContract?: unknown })
              .propContract;
            const slotRaw = (rev as { slotContract?: unknown }).slotContract;
            if (propContract === undefined || propContract === null) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            const slotParsed = SlotContractSchema.safeParse(
              slotRaw ?? { slots: {} },
            );
            if (!slotParsed.success) {
              return {
                ok: false as const,
                error: "REVISION_NOT_FOUND" as const,
              };
            }
            await payload.update({
              collection: "component-definitions",
              id: defId,
              data: {
                propContract,
                slotContract: slotParsed.data,
              },
              user: user as TypedUser,
              overrideAccess: false,
            });
            await logCatalogActivity(payload, {
              resourceType: "componentRevision",
              resourceId: String(id),
              action: "rollback",
              actorId: (user as { id: unknown }).id as string | number,
              metadata: { definitionId: defId },
            });
            return { ok: true as const };
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
      { revisionId, actor },
    );

    return resultToResponse(c, result);
  },
);

publishingRouter.post(
  "/revisions/:id/acknowledge-impact",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const revisionId = c.req.param("id");
    try {
      const rev = await payload.findByID({
        collection: "component-revisions",
        id: revisionId,
        depth: 0,
        user: actor,
        overrideAccess: false,
      });
      if (!rev) {
        return resultToResponse(c, err("REVISION_NOT_FOUND"));
      }
      const status = typeof rev.status === "string" ? rev.status : "draft";
      if (status !== "approved") {
        return resultToResponse(c, err("INVALID_STATE"));
      }
      await payload.update({
        collection: "component-revisions",
        id: revisionId,
        data: {
          dependencyImpactAcknowledgedAt: new Date().toISOString(),
        },
        user: actor,
        overrideAccess: false,
      });
      return c.json({
        data: { acknowledged: true as const },
      });
    } catch (e) {
      const name =
        typeof e === "object" && e !== null && "name" in e
          ? String((e as { name: unknown }).name)
          : "";
      if (name === "Forbidden" || name === "ForbiddenError") {
        return resultToResponse(c, err("FORBIDDEN"));
      }
      return resultToResponse(c, err("PERSISTENCE_ERROR"));
    }
  },
);
