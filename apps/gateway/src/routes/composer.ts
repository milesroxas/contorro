import {
  type ComposerPageSummary,
  createPageCommand,
  loadComposerEditorStateQuery,
} from "@repo/application-page-composer";
import {
  allowsPagePublish,
  makePublishJobIdempotencyKey,
  publishPageCommand,
  rollbackPageFromSnapshotCommand,
} from "@repo/application-publish-flow";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { PayloadCompositionRepository } from "@repo/infrastructure-persistence";
import { err } from "@repo/kernel";
import { makeId } from "@repo/kernel";
import { Hono } from "hono";
import { z } from "zod";

import { logCatalogActivity } from "../lib/catalog-activity-log.js";
import { resultToResponse } from "../lib/result-to-response.js";
import { composerSessionMiddleware } from "../middleware/composer-session.js";
import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { publisherSessionMiddleware } from "../middleware/publisher-session.js";
import { getPayloadInstance } from "../payload.js";
import { createCompositionMutationRouter } from "./composition-mutations.js";

const rollbackBody = z.object({
  releaseSnapshotId: z.string(),
});

const createPageBody = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("blank"),
    title: z.string(),
    slug: z.string(),
  }),
  z.object({
    mode: z.literal("template"),
    title: z.string(),
    slug: z.string(),
    templateId: z.string(),
  }),
]);

function toComposerPageSummary(doc: unknown): ComposerPageSummary | null {
  if (typeof doc !== "object" || doc === null) {
    return null;
  }
  const d = doc as Record<string, unknown>;
  if (d.id === undefined || d.id === null) {
    return null;
  }
  const title = typeof d.title === "string" ? d.title : "";
  const slug = typeof d.slug === "string" ? d.slug : "";
  const rel = d.pageComposition;
  let compositionDocumentId: string | undefined;
  if (typeof rel === "object" && rel !== null && "id" in rel) {
    const rid = (rel as { id: unknown }).id;
    if (rid !== undefined && rid !== null) {
      compositionDocumentId = String(rid);
    }
  } else if (typeof rel === "string" || typeof rel === "number") {
    compositionDocumentId = String(rel);
  }
  if (!compositionDocumentId) {
    return null;
  }
  return {
    id: String(d.id),
    title,
    slug,
    compositionDocumentId,
  };
}

const mutations = createCompositionMutationRouter(composerSessionMiddleware);

export const composerRouter = new Hono();

composerRouter.post("/pages", composerSessionMiddleware, async (c) => {
  const raw = await c.req.json();
  const body = createPageBody.safeParse(raw);
  if (!body.success) {
    return resultToResponse(c, err("VALIDATION_ERROR"));
  }
  const payload = await getPayloadInstance();
  const actor = c.get("actor");

  const result = await createPageCommand(
    {
      compositionSlug: (pageSlug: string) =>
        `${pageSlug}-tree-${makeId().slice(0, 10)}`,
      createComposition: async ({ title, slug, composition }) => {
        try {
          const doc = await payload.create({
            collection: "page-compositions",
            data: {
              title,
              slug,
              composition,
            },
            draft: true,
            user: actor,
            overrideAccess: false,
          });
          return { id: String(doc.id) };
        } catch {
          return null;
        }
      },
      createPage: async ({ title, slug, pageCompositionId }) => {
        try {
          const doc = await payload.create({
            collection: "pages",
            data: {
              title,
              slug,
              pageComposition: pageCompositionId,
            },
            draft: true,
            user: actor,
            overrideAccess: false,
          });
          return { id: String(doc.id) };
        } catch {
          return null;
        }
      },
      deleteComposition: async (compositionId: string) => {
        try {
          await payload.delete({
            collection: "page-compositions",
            id: compositionId,
            overrideAccess: true,
          });
        } catch {
          /* best-effort rollback */
        }
      },
      loadCompositionForTemplate: async (templateId: string) => {
        let template: unknown;
        try {
          template = await payload.findByID({
            collection: "templates",
            id: templateId,
            depth: 1,
            draft: true,
            user: actor,
            overrideAccess: false,
          });
        } catch {
          return null;
        }
        if (!template || typeof template !== "object") {
          return null;
        }
        const rel = (template as { sourceComposition?: unknown })
          .sourceComposition;
        let compId: string | undefined;
        if (typeof rel === "object" && rel !== null && "id" in rel) {
          const rid = (rel as { id: unknown }).id;
          if (rid !== undefined && rid !== null) {
            compId = String(rid);
          }
        } else if (typeof rel === "string" || typeof rel === "number") {
          compId = String(rel);
        }
        if (!compId) {
          return null;
        }
        let compDoc: unknown;
        try {
          compDoc = await payload.findByID({
            collection: "page-compositions",
            id: compId,
            depth: 0,
            draft: true,
            user: actor,
            overrideAccess: false,
          });
        } catch {
          return null;
        }
        if (
          !compDoc ||
          typeof compDoc !== "object" ||
          !("composition" in compDoc)
        ) {
          return null;
        }
        const parsed = PageCompositionSchema.safeParse(
          (compDoc as { composition: unknown }).composition,
        );
        return parsed.success ? parsed.data : null;
      },
    },
    body.data,
  );

  return resultToResponse(c, result);
});

composerRouter.get("/templates", composerSessionMiddleware, async (c) => {
  const payload = await getPayloadInstance();
  const actor = c.get("actor");
  const found = await payload.find({
    collection: "templates",
    depth: 0,
    limit: 200,
    sort: "title",
    where: {
      _status: {
        equals: "published",
      },
    },
    user: actor,
    overrideAccess: false,
  });
  const templates = found.docs.map((doc) => ({
    id: String(doc.id),
    title: typeof doc.title === "string" ? doc.title : "",
    slug: typeof doc.slug === "string" ? doc.slug : "",
  }));
  return c.json({ data: { templates } });
});

composerRouter.post(
  "/pages/:pageId/publish",
  publisherSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor");
    const pageId = c.req.param("pageId");

    const result = await publishPageCommand(
      {
        tryPublish: async (id) => {
          try {
            const existing = await payload.findByID({
              collection: "pages",
              id,
              depth: 1,
              draft: true,
              user: actor,
              overrideAccess: false,
            });
            if (!existing) {
              return { ok: false as const, error: "PAGE_NOT_FOUND" as const };
            }

            const rel = existing.pageComposition;
            const compositionId =
              typeof rel === "object" && rel !== null && "id" in rel
                ? String((rel as { id: unknown }).id)
                : typeof rel === "string" || typeof rel === "number"
                  ? String(rel)
                  : null;
            if (!compositionId) {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }

            const compDoc = await payload.findByID({
              collection: "page-compositions",
              id: compositionId,
              depth: 0,
              draft: true,
              user: actor,
              overrideAccess: false,
            });
            if (!compDoc || typeof compDoc !== "object") {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }

            const crs = (compDoc as { catalogReviewStatus?: string })
              .catalogReviewStatus;
            const catalogReviewStatus =
              crs === "submitted" ||
              crs === "approved" ||
              crs === "rejected" ||
              crs === "none"
                ? crs
                : "none";
            if (!allowsPagePublish(catalogReviewStatus)) {
              return {
                ok: false as const,
                error: "CATALOG_NOT_APPROVED" as const,
              };
            }

            const cRow = compDoc as unknown as {
              updatedAt?: unknown;
              composition?: unknown;
            };
            const updatedAt =
              cRow.updatedAt instanceof Date
                ? cRow.updatedAt.toISOString()
                : String(cRow.updatedAt ?? "");
            const idempotencyKey = makePublishJobIdempotencyKey({
              scope: "page_publish",
              targetId: String(id),
              intentId: updatedAt,
            });

            const dup = await payload.find({
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
            if (dup.docs.length > 0) {
              return { ok: true as const, alreadyApplied: true };
            }

            const parsed = PageCompositionSchema.safeParse(cRow.composition);
            if (!parsed.success) {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }

            const job = await payload.create({
              collection: "publish-jobs",
              data: {
                idempotencyKey,
                kind: "page_publish",
                status: "pending",
                targetPage: String(id),
              },
              overrideAccess: true,
            });

            const snap = await payload.create({
              collection: "release-snapshots",
              data: {
                page: String(id),
                pageComposition: compositionId,
                snapshotComposition: parsed.data,
              },
              overrideAccess: true,
            });

            await payload.update({
              collection: "publish-jobs",
              id: String(job.id),
              data: { releaseSnapshot: String(snap.id) },
              overrideAccess: true,
            });

            await payload.update({
              collection: "page-compositions",
              id: compositionId,
              data: {},
              draft: false,
              overrideAccess: true,
            });

            await payload.update({
              collection: "pages",
              id,
              data: {},
              draft: false,
              user: actor,
              overrideAccess: false,
            });

            await payload.update({
              collection: "publish-jobs",
              id: String(job.id),
              data: { status: "succeeded" },
              overrideAccess: true,
            });

            await logCatalogActivity(payload, {
              resourceType: "page",
              resourceId: String(id),
              action: "publish",
              actorId: (actor as { id: unknown }).id as string | number,
              metadata: { releaseSnapshotId: String(snap.id) },
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
      { pageId, actor },
    );

    return resultToResponse(c, result);
  },
);

composerRouter.post(
  "/pages/:pageId/rollback",
  publisherSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor");
    const pageId = c.req.param("pageId");
    const raw = await c.req.json();
    const body = rollbackBody.safeParse(raw);
    if (!body.success) {
      return resultToResponse(c, err("VALIDATION_ERROR"));
    }

    const result = await rollbackPageFromSnapshotCommand(
      {
        tryRollback: async (pId, snapshotId, user) => {
          try {
            const snap = await payload.findByID({
              collection: "release-snapshots",
              id: snapshotId,
              depth: 1,
              user: user as typeof actor,
              overrideAccess: false,
            });
            if (!snap || typeof snap !== "object") {
              return {
                ok: false as const,
                error: "SNAPSHOT_NOT_FOUND" as const,
              };
            }
            const sp = (snap as { page?: unknown }).page;
            const sid =
              typeof sp === "object" && sp !== null && "id" in sp
                ? String((sp as { id: unknown }).id)
                : typeof sp === "string" || typeof sp === "number"
                  ? String(sp)
                  : null;
            if (sid !== pId) {
              return {
                ok: false as const,
                error: "SNAPSHOT_NOT_FOUND" as const,
              };
            }
            const pcomp = (snap as { pageComposition?: unknown })
              .pageComposition;
            const compositionId =
              typeof pcomp === "object" && pcomp !== null && "id" in pcomp
                ? String((pcomp as { id: unknown }).id)
                : typeof pcomp === "string" || typeof pcomp === "number"
                  ? String(pcomp)
                  : null;
            if (!compositionId) {
              return {
                ok: false as const,
                error: "SNAPSHOT_NOT_FOUND" as const,
              };
            }
            const tree = (snap as { snapshotComposition?: unknown })
              .snapshotComposition;
            const parsed = PageCompositionSchema.safeParse(tree);
            if (!parsed.success) {
              return {
                ok: false as const,
                error: "PERSISTENCE_ERROR" as const,
              };
            }

            const rbKey = makePublishJobIdempotencyKey({
              scope: "rollback",
              targetId: pId,
              intentId: snapshotId,
            });
            await payload.create({
              collection: "publish-jobs",
              data: {
                idempotencyKey: rbKey,
                kind: "rollback",
                status: "succeeded",
                targetPage: pId,
                releaseSnapshot: snapshotId,
              },
              overrideAccess: true,
            });

            await payload.update({
              collection: "page-compositions",
              id: compositionId,
              data: { composition: parsed.data },
              draft: false,
              user: user as typeof actor,
              overrideAccess: true,
            });

            await payload.update({
              collection: "pages",
              id: pId,
              data: {},
              draft: false,
              user: user as typeof actor,
              overrideAccess: false,
            });

            await logCatalogActivity(payload, {
              resourceType: "page",
              resourceId: pId,
              action: "rollback",
              actorId: (user as { id: unknown }).id as string | number,
              metadata: { releaseSnapshotId: snapshotId },
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
      {
        pageId,
        releaseSnapshotId: body.data.releaseSnapshotId,
        actor,
      },
    );

    return resultToResponse(c, result);
  },
);

composerRouter.post(
  "/compositions/:id/approve-catalog",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor");
    const compositionDocumentId = c.req.param("id");
    try {
      const comp = await payload.findByID({
        collection: "page-compositions",
        id: compositionDocumentId,
        depth: 0,
        draft: true,
        user: actor,
        overrideAccess: false,
      });
      if (!comp) {
        return resultToResponse(c, err("NOT_FOUND"));
      }
      const crs = (comp as { catalogReviewStatus?: string })
        .catalogReviewStatus;
      if (crs !== "submitted") {
        return resultToResponse(c, err("INVALID_STATE"));
      }
      await payload.update({
        collection: "page-compositions",
        id: compositionDocumentId,
        data: { catalogReviewStatus: "approved" },
        draft: true,
        user: actor,
        overrideAccess: false,
      });
      await logCatalogActivity(payload, {
        resourceType: "pageComposition",
        resourceId: compositionDocumentId,
        action: "approve",
        actorId: (actor as { id: unknown }).id as string | number,
      });
      return c.json({ data: { approved: true as const } });
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

composerRouter.get("/pages/:pageId", composerSessionMiddleware, async (c) => {
  const payload = await getPayloadInstance();
  const actor = c.get("actor");
  const pageId = c.req.param("pageId");
  let doc: unknown;
  try {
    doc = await payload.findByID({
      collection: "pages",
      id: pageId,
      depth: 1,
      draft: true,
      user: actor,
      overrideAccess: false,
    });
  } catch {
    return resultToResponse(c, err("NOT_FOUND"));
  }
  if (!doc) {
    return resultToResponse(c, err("NOT_FOUND"));
  }
  const summary = toComposerPageSummary(doc);
  if (!summary) {
    return resultToResponse(c, err("NOT_FOUND"));
  }
  const repo = new PayloadCompositionRepository(payload);
  const loaded = await loadComposerEditorStateQuery(repo, {
    page: summary,
    actor,
  });
  return resultToResponse(c, loaded);
});

composerRouter.route("/", mutations);
