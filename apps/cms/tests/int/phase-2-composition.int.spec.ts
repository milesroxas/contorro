import { propContractToJsonSchema2020 } from "@repo/contracts-json-schema";
import { PageCompositionSchema, PropContractSchema } from "@repo/contracts-zod";
import { validatePageCompositionInvariants } from "@repo/domains-composition";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("Phase 2 — composition model", () => {
  it("validates Box > Box > Text and renders with primitive registry", () => {
    const raw = {
      rootId: "outer-1",
      nodes: {
        "outer-1": {
          id: "outer-1",
          kind: "primitive" as const,
          definitionKey: "primitive.box",
          parentId: null,
          childIds: ["box-1"],
          propValues: { tag: "div" },
        },
        "box-1": {
          id: "box-1",
          kind: "primitive" as const,
          definitionKey: "primitive.box",
          parentId: "outer-1",
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

  it("PropContractSchema validates primitive prop fields", () => {
    const parsed = PropContractSchema.safeParse({
      fields: {
        tag: { valueType: "string" },
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("exports JSON Schema 2020-12 for PropContractSchema", () => {
    const schema = propContractToJsonSchema2020();
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
  });
});
