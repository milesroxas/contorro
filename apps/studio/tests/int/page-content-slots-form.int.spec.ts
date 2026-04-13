import { describe, expect, it } from "vitest";

import { contentSlotsArrayFromDocumentLike } from "../../src/lib/page-content-slots-form.js";

describe("page-content-slots-form", () => {
  it("prefers top-level contentSlots when present", () => {
    const data = {
      contentSlots: [{ slotId: "main", blocks: [] }],
      version: { contentSlots: [{ slotId: "main", blocks: [{ x: 1 }] }] },
    };
    expect(contentSlotsArrayFromDocumentLike(data)).toEqual([
      { slotId: "main", blocks: [] },
    ]);
  });

  it("reads version.contentSlots when top-level is absent", () => {
    const data = {
      version: {
        contentSlots: [{ slotId: "main", blocks: [] }],
      },
    };
    expect(contentSlotsArrayFromDocumentLike(data)).toEqual([
      { slotId: "main", blocks: [] },
    ]);
  });

  it("returns undefined for empty document", () => {
    expect(contentSlotsArrayFromDocumentLike(undefined)).toBeUndefined();
  });
});
