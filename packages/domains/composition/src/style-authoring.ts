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
type StyleSectionLabel =
  | "Color"
  | "Borders"
  | "Text"
  | "Layout"
  | "Spacing"
  | "Size";

const STYLE_SECTION_LABELS: Record<StyleSectionId, StyleSectionLabel> = {
  color: "Color",
  border: "Borders",
  text: "Text",
  layout: "Layout",
  spacing: "Spacing",
  size: "Size",
};

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
  "overflow",
  "overflowX",
  "overflowY",
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

const TYPOGRAPHY_BOX_STYLE_PROPERTIES: readonly StyleProperty[] = [
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
  "overflow",
  "overflowX",
  "overflowY",
];

const TEXT_STYLE_PROPERTIES = TYPOGRAPHY_BOX_STYLE_PROPERTIES;
const HEADING_STYLE_PROPERTIES = TYPOGRAPHY_BOX_STYLE_PROPERTIES;

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
  "overflow",
  "overflowX",
  "overflowY",
];

/** Size-only styles for `primitive.image` (token/utility bindings). */
const IMAGE_PRIMITIVE_STYLE_PROPERTIES: readonly StyleProperty[] = [
  "width",
  "height",
  "aspectRatio",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "overflow",
  "overflowX",
  "overflowY",
];

const VIDEO_STYLE_PROPERTIES: readonly StyleProperty[] = [
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
  "overflow",
  "overflowX",
  "overflowY",
];

const COLLECTION_STYLE_PROPERTIES: readonly StyleProperty[] =
  BOX_STYLE_PROPERTIES;

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
  "overflow",
  "overflowX",
  "overflowY",
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
  "overflow",
  "overflowX",
  "overflowY",
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
  overflow: "Overflow",
  overflowX: "Overflow X",
  overflowY: "Overflow Y",
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

const STYLE_PROPERTY_DEFAULT_VALUE_LABELS: Record<StyleProperty, string> = {
  background: "transparent",
  borderColor: "currentColor",
  borderRadius: "0",
  borderStyle: "none",
  borderWidth: "medium",
  color: "inherit",
  fontFamily: "inherit",
  fontSize: "inherit",
  fontWeight: "inherit",
  textAlign: "inherit",
  lineHeight: "inherit",
  letterSpacing: "inherit",
  textTransform: "inherit",
  fontStyle: "inherit",
  textDecorationLine: "none",
  display: "inline",
  flexDirection: "row",
  flexWrap: "nowrap",
  justifyContent: "normal",
  alignItems: "normal",
  alignSelf: "auto",
  flex: "0 1 auto",
  flexGrow: "0",
  flexShrink: "1",
  flexBasis: "auto",
  order: "0",
  overflow: "visible",
  overflowX: "visible",
  overflowY: "visible",
  padding: "0",
  paddingTop: "0",
  paddingRight: "0",
  paddingBottom: "0",
  paddingLeft: "0",
  margin: "0",
  marginTop: "0",
  marginRight: "0",
  marginBottom: "0",
  marginLeft: "0",
  gap: "normal",
  width: "auto",
  height: "auto",
  aspectRatio: "auto",
  minWidth: "auto",
  minHeight: "auto",
  maxWidth: "none",
  maxHeight: "none",
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
  overflow: "layout",
  overflowX: "layout",
  overflowY: "layout",
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
  "primitive.section": BOX_STYLE_PROPERTIES,
  "primitive.text": TEXT_STYLE_PROPERTIES,
  "primitive.heading": HEADING_STYLE_PROPERTIES,
  "primitive.button": BUTTON_STYLE_PROPERTIES,
  "primitive.image": IMAGE_PRIMITIVE_STYLE_PROPERTIES,
  "primitive.video": VIDEO_STYLE_PROPERTIES,
  "primitive.collection": COLLECTION_STYLE_PROPERTIES,
  "primitive.slot": SLOT_STYLE_PROPERTIES,
  "primitive.libraryComponent": LIBRARY_COMPONENT_STYLE_PROPERTIES,
};

export function stylePropertiesForDefinitionKey(
  definitionKey: string,
): readonly StyleProperty[] {
  return PRIMITIVE_STYLE_PROPERTIES[definitionKey] ?? EMPTY_STYLE_PROPERTIES;
}

export function stylePropertyLabel(property: StyleProperty): string {
  return STYLE_PROPERTY_LABELS[property];
}

export function stylePropertyDefaultValueLabel(
  property: StyleProperty,
): string {
  return STYLE_PROPERTY_DEFAULT_VALUE_LABELS[property];
}

export function styleSectionForProperty(
  property: StyleProperty,
): StyleSectionId {
  return STYLE_PROPERTY_SECTIONS[property];
}

export function styleSectionLabel(
  sectionId: StyleSectionId,
): StyleSectionLabel {
  return STYLE_SECTION_LABELS[sectionId];
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
