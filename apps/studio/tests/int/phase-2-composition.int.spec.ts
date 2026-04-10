import { propContractToJsonSchema2020 } from "@repo/contracts-json-schema";
import { PageCompositionSchema, PropContractSchema } from "@repo/contracts-zod";
import { validatePageCompositionInvariants } from "@repo/domains-composition";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Phase 2 — composition model", () => {
  it("validates Stack > Box > Text and renders with primitive registry", () => {
    const raw = {
      rootId: "stack-1",
      nodes: {
        "stack-1": {
          id: "stack-1",
          kind: "primitive" as const,
          definitionKey: "primitive.stack",
          parentId: null,
          childIds: ["box-1"],
          propValues: {
            direction: "column",
            gap: "8px",
            align: "stretch",
            justify: "flex-start",
          },
        },
        "box-1": {
          id: "box-1",
          kind: "primitive" as const,
          definitionKey: "primitive.box",
          parentId: "stack-1",
          childIds: ["text-1"],
        },
        "text-1": {
          id: "text-1",
          kind: "text" as const,
          definitionKey: "primitive.text",
          parentId: "box-1",
          childIds: [],
          propValues: { content: "Hello" },
        },
      },
      styleBindings: {},
    };

    const parsed = PageCompositionSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }

    const inv = validatePageCompositionInvariants(parsed.data);
    expect(inv.ok).toBe(true);

    render(renderComposition(parsed.data, defaultPrimitiveRegistry, []));
    expect(screen.getByText("Hello")).toBeDefined();
  });

  it("PropContractSchema validates Stack-relevant fields", () => {
    const stackLike = PropContractSchema.safeParse({
      fields: {
        direction: { valueType: "string" },
        gap: { valueType: "unknown" },
        align: { valueType: "string" },
        justify: { valueType: "string" },
      },
    });
    expect(stackLike.success).toBe(true);
  });

  it("exports JSON Schema 2020-12 for PropContractSchema", () => {
    const schema = propContractToJsonSchema2020();
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
  });
});
