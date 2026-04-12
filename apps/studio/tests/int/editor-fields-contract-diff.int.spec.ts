import type { EditorFieldSpec } from "@repo/contracts-zod";
import { editorFieldsContractBreakingChanges } from "@repo/domains-composition";
import { describe, expect, it } from "vitest";

const text = (
  name: string,
  partial?: Partial<EditorFieldSpec>,
): EditorFieldSpec => ({
  name,
  type: "text",
  required: false,
  label: name,
  ...partial,
});

describe("editorFieldsContractBreakingChanges (v0.4)", () => {
  it("treats first publish as non-breaking", () => {
    expect(
      editorFieldsContractBreakingChanges(undefined, [text("headline")]),
    ).toEqual([]);
    expect(editorFieldsContractBreakingChanges([], [text("headline")])).toEqual(
      [],
    );
  });

  it("flags removal of a field", () => {
    const prev = [text("a")];
    const next = [text("b")];
    expect(editorFieldsContractBreakingChanges(prev, next)).toContain(
      "editor_field_removed",
    );
  });

  it("flags type change", () => {
    const prev = [text("title")];
    const next = [{ ...text("title"), type: "richText" as const }];
    expect(editorFieldsContractBreakingChanges(prev, next)).toContain(
      "editor_field_type_changed",
    );
  });

  it("flags optional field becoming required without default", () => {
    const prev = [text("x", { required: false })];
    const next = [text("x", { required: true })];
    expect(editorFieldsContractBreakingChanges(prev, next)).toContain(
      "became_required_without_default",
    );
  });

  it("allows optional to required when default is set", () => {
    const prev = [text("x", { required: false })];
    const next = [text("x", { required: true, defaultValue: "hi" })];
    expect(editorFieldsContractBreakingChanges(prev, next)).toEqual([]);
  });

  it("allows new optional field alongside existing", () => {
    const prev = [text("a")];
    const next = [text("a"), text("b")];
    expect(editorFieldsContractBreakingChanges(prev, next)).toEqual([]);
  });
});
