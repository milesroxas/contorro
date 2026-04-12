import { describe, expect, it } from "vitest";
import { getTestPayload } from "../helpers/getTestPayload.js";

describe("Designer block catalog (components)", () => {
  it("creates a url key from the title and keeps it stable when the title changes", async () => {
    const payload = await getTestPayload();
    const suffix = Date.now();
    const displayName = `Int catalog test ${suffix}`;

    const created = await payload.create({
      collection: "components",
      draft: true,
      data: {
        displayName,
        propContract: { fields: {} },
        editorFields: { editorFields: [] },
      },
      overrideAccess: true,
    });

    try {
      expect(typeof created.key).toBe("string");
      expect(created.key.length).toBeGreaterThan(0);

      const updated = await payload.update({
        collection: "components",
        id: created.id,
        data: { displayName: `${displayName} renamed` },
        overrideAccess: true,
      });

      expect(updated.key).toBe(created.key);
    } finally {
      await payload.delete({
        collection: "components",
        id: created.id,
        overrideAccess: true,
      });
    }
  });
});
