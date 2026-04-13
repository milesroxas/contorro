import type { FormState } from "payload";
import { describe, expect, it } from "vitest";

import {
  collectBlockPathsForSiblingLookup,
  extractDefinitionId,
  resolveComponentDefinitionRef,
} from "../../src/lib/designer-editor-fields-resolution.js";

function fieldValue(value: unknown): { value: unknown } {
  return { value };
}

describe("designer-editor-fields-resolution — pages contentSlots blocks", () => {
  const editorPath = "contentSlots.0.blocks.0.editorFieldValues";
  const componentKey = "contentSlots.0.blocks.0.componentDefinition";

  it("resolves componentDefinition via getSiblingData + direct keys when paths match Payload form state", () => {
    const fields: FormState = {
      [componentKey]: fieldValue(62),
      [editorPath]: fieldValue({ headline: "Hello" }),
    };
    const siblingPaths = collectBlockPathsForSiblingLookup(
      editorPath,
      editorPath,
      editorPath,
    );
    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: editorPath,
      siblingLookupPaths: siblingPaths,
      fields,
      documentForm: undefined,
      form: undefined,
      getData: undefined,
      savedDocumentData: undefined,
    });
    expect(raw).toBe(62);
    expect(extractDefinitionId(raw)).toBe(62);
  });

  it("resolves when useField path lags to block row only (no .editorFieldValues)", () => {
    const fields: FormState = {
      [componentKey]: fieldValue(99),
      [editorPath]: fieldValue({ headline: "x" }),
    };
    const siblingPaths = collectBlockPathsForSiblingLookup(
      editorPath,
      "contentSlots.0.blocks.0",
      "contentSlots.0.blocks.0",
    );
    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: editorPath,
      siblingLookupPaths: siblingPaths,
      fields,
      documentForm: undefined,
      form: undefined,
      getData: undefined,
      savedDocumentData: undefined,
    });
    expect(extractDefinitionId(raw)).toBe(99);
  });

  it("resolves polymorphic relationship value shape", () => {
    const fields: FormState = {
      [componentKey]: fieldValue({
        relationTo: "components",
        value: 42,
      }),
      [editorPath]: fieldValue({}),
    };
    const siblingPaths = collectBlockPathsForSiblingLookup(
      editorPath,
      editorPath,
      undefined,
    );
    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: editorPath,
      siblingLookupPaths: siblingPaths,
      fields,
      documentForm: undefined,
      form: undefined,
      getData: undefined,
      savedDocumentData: undefined,
    });
    expect(extractDefinitionId(raw)).toBe(42);
  });

  it("falls back to document getData when form keys missing", () => {
    const fields: FormState = {};
    const doc = {
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              componentDefinition: 77,
              editorFieldValues: {},
            },
          ],
        },
      ],
    };
    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: editorPath,
      siblingLookupPaths: collectBlockPathsForSiblingLookup(
        editorPath,
        editorPath,
        editorPath,
      ),
      fields,
      documentForm: undefined,
      form: undefined,
      getData: () => doc,
      savedDocumentData: undefined,
    });
    expect(extractDefinitionId(raw)).toBe(77);
  });

  it("pairs version.contentSlots form keys with top-level editor path", () => {
    const fields: FormState = {
      "version.contentSlots.0.blocks.0.componentDefinition": fieldValue(55),
      [editorPath]: fieldValue({ headline: "v" }),
    };
    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: editorPath,
      siblingLookupPaths: collectBlockPathsForSiblingLookup(
        editorPath,
        editorPath,
        editorPath,
      ),
      fields,
      documentForm: undefined,
      form: undefined,
      getData: undefined,
      savedDocumentData: undefined,
    });
    expect(extractDefinitionId(raw)).toBe(55);
  });

  it("prefers live context path over stale prop path for new block rows", () => {
    const staleEditorPath = "contentSlots.0.blocks.0.editorFieldValues";
    const liveEditorPath = "contentSlots.0.blocks.1.editorFieldValues";
    const fields: FormState = {
      "contentSlots.0.blocks.0.componentDefinition": fieldValue(11),
      "contentSlots.0.blocks.1.componentDefinition": fieldValue(22),
      [staleEditorPath]: fieldValue({ headline: "old" }),
      [liveEditorPath]: fieldValue({ headline: "new" }),
    };

    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: liveEditorPath,
      siblingLookupPaths: collectBlockPathsForSiblingLookup(
        staleEditorPath,
        staleEditorPath,
        liveEditorPath,
      ),
      fields,
      documentForm: undefined,
      form: undefined,
      getData: undefined,
      savedDocumentData: undefined,
    });

    expect(extractDefinitionId(raw)).toBe(22);
  });

  it("resolves from live row path in another slot when prop path is stale", () => {
    const staleEditorPath = "contentSlots.0.blocks.0.editorFieldValues";
    const liveRowPath = "contentSlots.1.blocks.0";
    const fields: FormState = {
      "contentSlots.0.blocks.0.componentDefinition": fieldValue(11),
      "contentSlots.1.blocks.0.componentDefinition": fieldValue(33),
      [staleEditorPath]: fieldValue({ headline: "old" }),
      "contentSlots.1.blocks.0.editorFieldValues": fieldValue({
        headline: "new",
      }),
    };

    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: liveRowPath,
      siblingLookupPaths: collectBlockPathsForSiblingLookup(
        staleEditorPath,
        staleEditorPath,
        liveRowPath,
      ),
      fields,
      documentForm: undefined,
      form: undefined,
      getData: undefined,
      savedDocumentData: undefined,
    });

    expect(extractDefinitionId(raw)).toBe(33);
  });

  it("resolves via form.getSiblingData when editor path is local", () => {
    const fields: FormState = {};
    const raw = resolveComponentDefinitionRef({
      editorFieldValuesPath: "editorFieldValues",
      siblingLookupPaths: collectBlockPathsForSiblingLookup(
        "editorFieldValues",
        "editorFieldValues",
        "editorFieldValues",
      ),
      fields,
      documentForm: undefined,
      form: {
        getSiblingData: (path: string) =>
          path === "editorFieldValues" ? { componentDefinition: 88 } : {},
      },
      getData: undefined,
      savedDocumentData: undefined,
    });
    expect(extractDefinitionId(raw)).toBe(88);
  });
});
