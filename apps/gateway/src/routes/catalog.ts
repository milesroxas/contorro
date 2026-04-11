import { promoteComponentDefinitionCommand } from "@repo/application-page-composer";
import { pageCompositionUsesDefinitionKey } from "@repo/application-publish-flow";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { Hono } from "hono";
import type { TypedUser } from "payload";

import { resultToResponse } from "../lib/result-to-response.js";
import { composerSessionMiddleware } from "../middleware/composer-session.js";
import { designerSessionMiddleware } from "../middleware/designer-session.js";
import { getPayloadInstance } from "../payload.js";

/** §8.2 — /api/gateway/catalog */
export const catalogRouter = new Hono();

catalogRouter.get(
  "/components/by-key/:key/usage",
  composerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const key = decodeURIComponent(c.req.param("key"));
    const found = await payload.find({
      collection: "page-compositions",
      limit: 500,
      depth: 0,
      user: actor,
      overrideAccess: false,
    });
    const compositionIds: string[] = [];
    for (const doc of found.docs) {
      const parsed = PageCompositionSchema.safeParse(doc.composition);
      if (
        parsed.success &&
        pageCompositionUsesDefinitionKey(parsed.data, key)
      ) {
        compositionIds.push(String(doc.id));
      }
    }
    if (compositionIds.length === 0) {
      return c.json({
        data: { compositionIds: [], pages: [] },
      });
    }
    const pages = await payload.find({
      collection: "pages",
      limit: 500,
      depth: 0,
      user: actor,
      overrideAccess: false,
      where: {
        pageComposition: {
          in: compositionIds,
        },
      },
    });
    const pageSummaries = pages.docs.map((p) => ({
      id: String(p.id),
      slug: typeof p.slug === "string" ? p.slug : "",
      title: typeof p.title === "string" ? p.title : "",
    }));
    return c.json({
      data: { compositionIds, pages: pageSummaries },
    });
  },
);

catalogRouter.get("/components", composerSessionMiddleware, async (c) => {
  const payload = await getPayloadInstance();
  const actor = c.get("actor") as TypedUser;
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
});

catalogRouter.post(
  "/components/:id/promote",
  designerSessionMiddleware,
  async (c) => {
    const payload = await getPayloadInstance();
    const actor = c.get("actor") as TypedUser;
    const definitionId = c.req.param("id");

    const result = await promoteComponentDefinitionCommand(
      {
        tryPromote: async (id, user) => {
          try {
            const existing = await payload.findByID({
              collection: "component-definitions",
              id,
              depth: 0,
              user: user as TypedUser,
              overrideAccess: false,
            });
            if (!existing) {
              return { ok: false as const, error: "NOT_FOUND" as const };
            }
            await payload.update({
              collection: "component-definitions",
              id,
              data: { visibleInEditorCatalog: true },
              user: user as TypedUser,
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
            return { ok: false as const, error: "PERSISTENCE_ERROR" as const };
          }
        },
      },
      { definitionId, actor },
    );

    return resultToResponse(c, result);
  },
);
