import { describe, expect, it } from "vitest";
import { getTestPayload } from "../helpers/getTestPayload.js";

describe("Designer block catalog (components)", () => {
  it("page block picker filter: only definitions with visibleInEditorCatalog", async () => {
    const payload = await getTestPayload();
    const key = `int-catalog-${Date.now()}`;

    const created = await payload.create({
      collection: "components",
      draft: true,
      data: {
        key,
        displayName: "Int catalog test",
        propContract: { fields: {} },
        editorFields: { editorFields: [] },
        visibleInEditorCatalog: false,
        catalogReviewStatus: "none",
      },
      overrideAccess: true,
    });

    try {
      const hiddenFromFilter = await payload.find({
        collection: "components",
        where: {
          and: [
            { id: { equals: created.id } },
            { visibleInEditorCatalog: { equals: true } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      });
      expect(hiddenFromFilter.docs.length).toBe(0);

      await payload.update({
        collection: "components",
        id: created.id,
        data: { visibleInEditorCatalog: true },
        overrideAccess: true,
      });

      const visibleFromFilter = await payload.find({
        collection: "components",
        where: {
          and: [
            { id: { equals: created.id } },
            { visibleInEditorCatalog: { equals: true } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      });
      expect(visibleFromFilter.docs.length).toBe(1);
    } finally {
      await payload.delete({
        collection: "components",
        id: created.id,
        overrideAccess: true,
      });
    }
  });
});
