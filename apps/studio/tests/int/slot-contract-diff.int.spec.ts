import type { SlotDefinition } from "@repo/contracts-zod";
import { slotContractBreakingChanges } from "@repo/domains-composition";
import { describe, expect, it } from "vitest";

const text = (
  name: string,
  partial?: Partial<SlotDefinition>,
): SlotDefinition => ({
  name,
  type: "text",
  required: false,
  label: name,
  ...partial,
});

describe("slotContractBreakingChanges (v0.4)", () => {
  it("treats first publish as non-breaking", () => {
    expect(slotContractBreakingChanges(undefined, [text("headline")])).toEqual(
      [],
    );
    expect(slotContractBreakingChanges([], [text("headline")])).toEqual([]);
  });

  it("flags removal of a slot", () => {
    const prev = [text("a")];
    const next = [text("b")];
    expect(slotContractBreakingChanges(prev, next)).toContain("slot_removed");
  });

  it("flags type change", () => {
    const prev = [text("title")];
    const next = [{ ...text("title"), type: "richText" as const }];
    expect(slotContractBreakingChanges(prev, next)).toContain(
      "slot_type_changed",
    );
  });

  it("flags optional slot becoming required without default", () => {
    const prev = [text("x", { required: false })];
    const next = [text("x", { required: true })];
    expect(slotContractBreakingChanges(prev, next)).toContain(
      "became_required_without_default",
    );
  });

  it("allows optional to required when default is set", () => {
    const prev = [text("x", { required: false })];
    const next = [text("x", { required: true, defaultValue: "hi" })];
    expect(slotContractBreakingChanges(prev, next)).toEqual([]);
  });

  it("allows new optional slot alongside existing", () => {
    const prev = [text("a")];
    const next = [text("a"), text("b")];
    expect(slotContractBreakingChanges(prev, next)).toEqual([]);
  });
});
