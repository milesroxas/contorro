import type { CompositionNode } from "@repo/contracts-zod";

type PrimitiveSpec = {
  definitionKey: string;
  allowsChildren: boolean;
  availableInPalette: boolean;
  creatableInBuilder: boolean;
  defaultPropValues: Record<string, unknown>;
};

const PRIMITIVE_SPECS = [
  {
    definitionKey: "primitive.box",
    allowsChildren: true,
    availableInPalette: true,
    creatableInBuilder: true,
    defaultPropValues: {},
  },
  {
    definitionKey: "primitive.text",
    allowsChildren: false,
    availableInPalette: true,
    creatableInBuilder: true,
    defaultPropValues: { content: "" },
  },
  {
    definitionKey: "primitive.heading",
    allowsChildren: false,
    availableInPalette: true,
    creatableInBuilder: true,
    defaultPropValues: { content: "Heading", level: "h2" },
  },
  {
    definitionKey: "primitive.button",
    allowsChildren: false,
    availableInPalette: true,
    creatableInBuilder: true,
    defaultPropValues: {
      label: "Button",
      linkType: "url",
      href: "",
      collectionSlug: "",
      entrySlug: "",
      openInNewTab: false,
    },
  },
  {
    definitionKey: "primitive.image",
    allowsChildren: false,
    availableInPalette: true,
    creatableInBuilder: true,
    defaultPropValues: {
      src: "",
      alt: "",
      objectFit: "cover",
    },
  },
  {
    definitionKey: "primitive.slot",
    allowsChildren: false,
    availableInPalette: true,
    creatableInBuilder: true,
    defaultPropValues: { slotId: "main" },
  },
  {
    definitionKey: "primitive.libraryComponent",
    allowsChildren: false,
    availableInPalette: false,
    creatableInBuilder: true,
    defaultPropValues: {},
  },
  // Legacy primitives kept for backwards compatibility with existing data.
  {
    definitionKey: "primitive.stack",
    allowsChildren: true,
    availableInPalette: false,
    creatableInBuilder: false,
    defaultPropValues: {
      direction: "column",
      gap: "8px",
      align: "stretch",
      justify: "flex-start",
    },
  },
  {
    definitionKey: "primitive.grid",
    allowsChildren: true,
    availableInPalette: false,
    creatableInBuilder: false,
    defaultPropValues: { columns: 1, gap: "0" },
  },
] as const satisfies readonly PrimitiveSpec[];

const PRIMITIVE_SPEC_MAP: Map<string, PrimitiveSpec> = new Map(
  PRIMITIVE_SPECS.map((spec) => [spec.definitionKey, spec]),
);

export const KNOWN_PRIMITIVE_KEYS = PRIMITIVE_SPECS.map(
  (spec) => spec.definitionKey,
);

export const BUILDER_PALETTE_PRIMITIVE_KEYS = PRIMITIVE_SPECS.filter(
  (spec) => spec.availableInPalette,
).map((spec) => spec.definitionKey);

export function isKnownPrimitiveKey(definitionKey: string): boolean {
  return PRIMITIVE_SPEC_MAP.has(definitionKey);
}

export function isBuilderPalettePrimitiveKey(definitionKey: string): boolean {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  return spec?.availableInPalette ?? false;
}

export function isBuilderCreatablePrimitiveKey(definitionKey: string): boolean {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  return spec?.creatableInBuilder ?? false;
}

export function isContainerPrimitiveKey(definitionKey: string): boolean {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  return spec?.allowsChildren ?? false;
}

export function defaultPrimitivePropValues(
  definitionKey: string,
): Record<string, unknown> {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  if (!spec) {
    return {};
  }
  return { ...spec.defaultPropValues };
}

export function primitiveKindForDefinitionKey(
  definitionKey: string,
): CompositionNode["kind"] {
  if (definitionKey === "primitive.text") {
    return "text";
  }
  if (definitionKey === "primitive.slot") {
    return "slot";
  }
  if (definitionKey === "primitive.libraryComponent") {
    return "designerComponent";
  }
  return "primitive";
}
