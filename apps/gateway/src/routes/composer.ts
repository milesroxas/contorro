import {
  type ComposerPageSummary,
  createPageCommand,
  loadComposerEditorStateQuery,
} from "@repo/application-page-composer";
import { publishPageCommand } from "@repo/application-publish-flow";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { PayloadCompositionRepository } from "@repo/infrastructure-persistence";
import { err } from "@repo/kernel";
import { makeId } from "@repo/kernel";
import { Hono } from "hono";
import { z } from "zod";

import { resultToResponse } from "../lib/result-to-response.js";
import { composerSessionMiddleware } from "../middleware/composer-session.js";
import { publisherSessionMiddleware } from "../middleware/publisher-session.js";
import { getPayloadInstance } from "../payload.js";
import { createCompositionMutationRouter } from "./composition-mutations.js";

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

composerRouter.get(
  "/component-catalog",
  composerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor");
    const found = await payload.find({
      collection: "component-definitions",
      depth: 0,
      limit: 500,
      sort: "displayName",
      where: {
        visibleInEditorCatalog: {
          equals: true,
        },
      },
      user: actor,
      overrideAccess: false,
    });
    const items = found.docs.map((doc) => ({
      id: String(doc.id),
      key: typeof doc.key === "string" ? doc.key : "",
      displayName: typeof doc.displayName === "string" ? doc.displayName : "",
    }));
    return c.json({ data: { items } });
  },
);

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
              depth: 0,
              draft: true,
              user: actor,
              overrideAccess: false,
            });
            if (!existing) {
              return { ok: false as const, error: "PAGE_NOT_FOUND" as const };
            }
            await payload.update({
              collection: "pages",
              id,
              data: {},
              draft: false,
              user: actor,
              overrideAccess: false,
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
