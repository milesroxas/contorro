import type { PageComposition, StyleProperty } from "@repo/contracts-zod";

const EMPTY_STYLE_PROPERTIES: readonly StyleProperty[] = [];

const BOX_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "background",
  "color",
  "padding",
  "margin",
  "gap",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const TEXT_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "color",
  "margin",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const IMAGE_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "margin",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const SLOT_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "background",
  "padding",
  "margin",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const LIBRARY_COMPONENT_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "margin",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const STYLE_PROPERTY_LABELS: Record<StyleProperty, string> = {
  background: "Background",
  color: "Text color",
  padding: "Padding",
  margin: "Margin",
  gap: "Gap",
  width: "Width",
  height: "Height",
  minWidth: "Min width",
  minHeight: "Min height",
  maxWidth: "Max width",
  maxHeight: "Max height",
};

const PRIMITIVE_STYLE_PROPERTIES: Record<string, readonly StyleProperty[]> = {
  "primitive.box": BOX_STYLE_PROPERTIES,
  "primitive.text": TEXT_STYLE_PROPERTIES,
  "primitive.image": IMAGE_STYLE_PROPERTIES,
  "primitive.slot": SLOT_STYLE_PROPERTIES,
  "primitive.libraryComponent": LIBRARY_COMPONENT_STYLE_PROPERTIES,
  // Legacy primitives.
  "primitive.stack": BOX_STYLE_PROPERTIES,
  "primitive.grid": BOX_STYLE_PROPERTIES,
};

export function stylePropertiesForDefinitionKey(
  definitionKey: string,
): readonly StyleProperty[] {
  return PRIMITIVE_STYLE_PROPERTIES[definitionKey] ?? EMPTY_STYLE_PROPERTIES;
}

export function stylePropertyLabel(property: StyleProperty): string {
  return STYLE_PROPERTY_LABELS[property];
}

export type InvalidStyleTokenIssue = {
  bindingId: string;
  property: StyleProperty;
  token: string;
};

export function findInvalidStyleTokens(
  composition: PageComposition,
  allowedTokenKeys: ReadonlySet<string>,
): InvalidStyleTokenIssue[] {
  const issues: InvalidStyleTokenIssue[] = [];

  for (const sb of Object.values(composition.styleBindings)) {
    for (const prop of sb.properties) {
      if (!allowedTokenKeys.has(prop.token)) {
        issues.push({
          bindingId: sb.id,
          property: prop.property,
          token: prop.token,
        });
      }
    }
  }

  return issues;
}
