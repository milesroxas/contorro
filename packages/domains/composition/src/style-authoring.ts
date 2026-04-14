import type { PageComposition, StyleProperty } from "@repo/contracts-zod";

const EMPTY_STYLE_PROPERTIES: readonly StyleProperty[] = [];
const STYLE_SECTION_ORDER = [
  "color",
  "border",
  "text",
  "layout",
  "spacing",
  "size",
] as const;
export type StyleSectionId = (typeof STYLE_SECTION_ORDER)[number];

const BOX_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "background",
  "borderColor",
  "borderRadius",
  "borderStyle",
  "borderWidth",
  "color",
  "display",
  "flexDirection",
  "flexWrap",
  "justifyContent",
  "alignItems",
  "alignSelf",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "order",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
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
  "fontFamily",
  "fontSize",
  "fontWeight",
  "textAlign",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "fontStyle",
  "textDecorationLine",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const HEADING_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "color",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "textAlign",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "fontStyle",
  "textDecorationLine",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const BUTTON_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "background",
  "borderColor",
  "borderRadius",
  "borderStyle",
  "borderWidth",
  "color",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "textAlign",
  "lineHeight",
  "letterSpacing",
  "textTransform",
  "fontStyle",
  "textDecorationLine",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const IMAGE_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "borderColor",
  "borderRadius",
  "borderStyle",
  "borderWidth",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "height",
  "aspectRatio",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const SLOT_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "background",
  "borderColor",
  "borderRadius",
  "borderStyle",
  "borderWidth",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const LIBRARY_COMPONENT_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "borderColor",
  "borderRadius",
  "borderStyle",
  "borderWidth",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
];

const STYLE_PROPERTY_LABELS: Record<StyleProperty, string> = {
  background: "Background",
  borderColor: "Border color",
  borderRadius: "Border radius",
  borderStyle: "Border style",
  borderWidth: "Border width",
  color: "Text color",
  fontFamily: "Font family",
  fontSize: "Font size",
  fontWeight: "Font weight",
  textAlign: "Text align",
  lineHeight: "Line height",
  letterSpacing: "Letter spacing",
  textTransform: "Text transform",
  fontStyle: "Font style",
  textDecorationLine: "Text decoration",
  display: "Display",
  flexDirection: "Flex direction",
  flexWrap: "Flex wrap",
  justifyContent: "Justify content",
  alignItems: "Align items",
  alignSelf: "Align self",
  flex: "Flex",
  flexGrow: "Flex grow",
  flexShrink: "Flex shrink",
  flexBasis: "Flex basis",
  order: "Order",
  padding: "Padding",
  paddingTop: "Padding top",
  paddingRight: "Padding right",
  paddingBottom: "Padding bottom",
  paddingLeft: "Padding left",
  margin: "Margin",
  marginTop: "Margin top",
  marginRight: "Margin right",
  marginBottom: "Margin bottom",
  marginLeft: "Margin left",
  gap: "Gap",
  width: "Width",
  height: "Height",
  aspectRatio: "Aspect ratio",
  minWidth: "Min width",
  minHeight: "Min height",
  maxWidth: "Max width",
  maxHeight: "Max height",
};

const STYLE_PROPERTY_SECTIONS: Record<StyleProperty, StyleSectionId> = {
  background: "color",
  borderColor: "border",
  borderRadius: "border",
  borderStyle: "border",
  borderWidth: "border",
  color: "color",
  fontFamily: "text",
  fontSize: "text",
  fontWeight: "text",
  textAlign: "text",
  lineHeight: "text",
  letterSpacing: "text",
  textTransform: "text",
  fontStyle: "text",
  textDecorationLine: "text",
  display: "layout",
  flexDirection: "layout",
  flexWrap: "layout",
  justifyContent: "layout",
  alignItems: "layout",
  alignSelf: "layout",
  flex: "layout",
  flexGrow: "layout",
  flexShrink: "layout",
  flexBasis: "layout",
  order: "layout",
  padding: "spacing",
  paddingTop: "spacing",
  paddingRight: "spacing",
  paddingBottom: "spacing",
  paddingLeft: "spacing",
  margin: "spacing",
  marginTop: "spacing",
  marginRight: "spacing",
  marginBottom: "spacing",
  marginLeft: "spacing",
  gap: "spacing",
  width: "size",
  height: "size",
  aspectRatio: "size",
  minWidth: "size",
  minHeight: "size",
  maxWidth: "size",
  maxHeight: "size",
};

const PRIMITIVE_STYLE_PROPERTIES: Record<string, readonly StyleProperty[]> = {
  "primitive.box": BOX_STYLE_PROPERTIES,
  "primitive.text": TEXT_STYLE_PROPERTIES,
  "primitive.heading": HEADING_STYLE_PROPERTIES,
  "primitive.button": BUTTON_STYLE_PROPERTIES,
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

export function styleSectionForProperty(
  property: StyleProperty,
): StyleSectionId {
  return STYLE_PROPERTY_SECTIONS[property];
}

export function stylePropertiesBySectionForDefinitionKey(
  definitionKey: string,
): ReadonlyArray<{ id: StyleSectionId; properties: readonly StyleProperty[] }> {
  const properties = stylePropertiesForDefinitionKey(definitionKey);
  return STYLE_SECTION_ORDER.map((id) => ({
    id,
    properties: properties.filter(
      (property) => STYLE_PROPERTY_SECTIONS[property] === id,
    ),
  })).filter((section) => section.properties.length > 0);
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
      if (prop.type !== "token") {
        continue;
      }
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
