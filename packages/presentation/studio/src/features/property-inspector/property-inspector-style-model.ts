import type { TokenMeta } from "@repo/config-tailwind";
import type {
  CompositionNode,
  PageComposition,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import {
  type StyleSectionId,
  styleSectionForProperty,
  styleSectionLabel,
} from "@repo/domains-composition";
import type { Icon } from "@tabler/icons-react";
import {
  IconBorderStyle2,
  IconLayout2,
  IconPalette,
  IconRulerMeasure,
  IconSpacingHorizontal,
  IconTypography,
} from "@tabler/icons-react";

export function readStyleProperty(
  composition: PageComposition,
  node: CompositionNode,
  property: StyleProperty,
): StylePropertyEntry | undefined {
  if (!node.styleBindingId) {
    return undefined;
  }
  const sb = composition.styleBindings[node.styleBindingId];
  if (!sb) {
    return undefined;
  }
  return sb.properties.find((p) => p.property === property);
}

export function nodeHasNonEmptyStyleBinding(
  composition: PageComposition,
  node: CompositionNode,
): boolean {
  if (!node.styleBindingId) {
    return false;
  }
  const sb = composition.styleBindings[node.styleBindingId];
  return (sb?.properties.length ?? 0) > 0;
}

export const NONE_SELECT_VALUE = "__none__";

/** Properties rendered by the margin/padding ring control (not the grid below). */
export const SPACING_RING_PROPERTIES = new Set<StyleProperty>([
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
]);

const STYLE_SECTION_DISPLAY_ORDER: readonly StyleSectionId[] = [
  "layout",
  "spacing",
  "size",
  "color",
  "text",
  "border",
];

const STYLE_SECTION_ICON_BY_ID: Partial<Record<StyleSectionId, Icon>> = {
  color: IconPalette,
  border: IconBorderStyle2,
  text: IconTypography,
  layout: IconLayout2,
  spacing: IconSpacingHorizontal,
  size: IconRulerMeasure,
};

const DEFAULT_STYLE_SECTION_ICON: Icon = IconLayout2;

export function orderedStyleSectionsForInspector(
  sections: ReadonlyArray<{
    id: StyleSectionId;
    properties: readonly StyleProperty[];
  }>,
): Array<{
  id: StyleSectionId;
  label: string;
  Icon: Icon;
  properties: readonly StyleProperty[];
}> {
  const orderIndex = new Map<StyleSectionId, number>(
    STYLE_SECTION_DISPLAY_ORDER.map((id, index) => [id, index]),
  );
  return [...sections]
    .sort((a, b) => {
      const indexA = orderIndex.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const indexB = orderIndex.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return indexA - indexB;
    })
    .map((section) => ({
      ...section,
      label: styleSectionLabel(section.id),
      Icon: STYLE_SECTION_ICON_BY_ID[section.id] ?? DEFAULT_STYLE_SECTION_ICON,
    }));
}

const PRIMARY_STYLE_PROPERTIES = new Set<StyleProperty>([
  "background",
  "borderColor",
  "borderRadius",
  "borderWidth",
  "color",
  "fontSize",
  "fontWeight",
  "textAlign",
  "display",
  "flexDirection",
  "justifyContent",
  "alignItems",
  "padding",
  "margin",
  "gap",
  "width",
  "height",
  "aspectRatio",
]);

const GROUPED_MORE_OPTIONS_SECTIONS = new Set<StyleSectionId>([
  "spacing",
  "size",
  "layout",
  "text",
]);

const MORE_OPTIONS_PROPERTY_ORDER: Partial<
  Record<StyleSectionId, readonly StyleProperty[]>
> = {
  spacing: [
    "marginTop",
    "paddingTop",
    "marginRight",
    "paddingRight",
    "marginBottom",
    "paddingBottom",
    "marginLeft",
    "paddingLeft",
  ],
  size: ["minWidth", "minHeight", "maxWidth", "maxHeight"],
  layout: [
    "flexGrow",
    "flexShrink",
    "flexBasis",
    "flex",
    "flexWrap",
    "alignSelf",
    "order",
    "overflow",
    "overflowX",
    "overflowY",
  ],
  text: [
    "fontFamily",
    "lineHeight",
    "letterSpacing",
    "textTransform",
    "fontStyle",
    "textDecorationLine",
  ],
};

export function groupedMoreOptionsProperties(
  sectionId: StyleSectionId,
  properties: readonly StyleProperty[],
): StyleProperty[] {
  const preferredOrder = MORE_OPTIONS_PROPERTY_ORDER[sectionId];
  if (!preferredOrder) {
    return [...properties];
  }
  const ordered = preferredOrder.filter((property) =>
    properties.includes(property),
  );
  const remaining = properties.filter(
    (property) => !ordered.includes(property),
  );
  return [...ordered, ...remaining];
}

export function moreOptionsGridClassName(sectionId: StyleSectionId): string {
  return GROUPED_MORE_OPTIONS_SECTIONS.has(sectionId)
    ? "grid grid-cols-2 gap-3"
    : "grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4";
}

export type InspectorOrderedStyleSection = ReturnType<
  typeof orderedStyleSectionsForInspector
>[number];

export function inspectorStyleSectionTopClass(sectionIndex: number): string {
  return sectionIndex === 0 ? "" : "border-t border-border/60 pt-4 ";
}

/**
 * Applies spacing/layout rules for which properties appear in the inspector
 * (e.g. `gap` in layout, never in the spacing ring list).
 */
export function normalizedSectionPropertiesForInspector(
  section: { id: StyleSectionId; properties: readonly StyleProperty[] },
  gapPropertyAvailable: boolean,
): StyleProperty[] {
  let sectionProperties = [...section.properties];
  if (section.id === "spacing") {
    sectionProperties = sectionProperties.filter(
      (property) => property !== "gap",
    );
  }
  if (
    section.id === "layout" &&
    gapPropertyAvailable &&
    !sectionProperties.includes("gap")
  ) {
    sectionProperties = [...sectionProperties, "gap"];
  }
  return sectionProperties;
}

export function collectStyleSectionIdsWithControls(
  orderedSections: InspectorOrderedStyleSection[],
  gapPropertyAvailable: boolean,
): StyleSectionId[] {
  const ids: StyleSectionId[] = [];
  for (const section of orderedSections) {
    const sectionProperties = normalizedSectionPropertiesForInspector(
      section,
      gapPropertyAvailable,
    );
    if (sectionProperties.length > 0) {
      ids.push(section.id);
    }
  }
  return ids;
}

export function inspectorStyleSectionModelFromSection(
  section: InspectorOrderedStyleSection,
  gapPropertyAvailable: boolean,
): {
  sectionProperties: StyleProperty[];
  filteredSectionProperties: StyleProperty[];
  primaryProperties: StyleProperty[];
  secondaryProperties: StyleProperty[];
  groupedSecondaryProperties: StyleProperty[];
  visibleProperties: StyleProperty[];
} | null {
  const sectionProperties = normalizedSectionPropertiesForInspector(
    section,
    gapPropertyAvailable,
  );
  if (sectionProperties.length === 0) {
    return null;
  }
  const filteredSectionProperties =
    section.id === "spacing"
      ? sectionProperties.filter(
          (property) => !SPACING_RING_PROPERTIES.has(property),
        )
      : sectionProperties;
  let primaryProperties = filteredSectionProperties.filter((property) =>
    PRIMARY_STYLE_PROPERTIES.has(property),
  );
  if (section.id === "layout" && primaryProperties.includes("gap")) {
    primaryProperties = [
      ...primaryProperties.filter((property) => property !== "gap"),
      "gap",
    ];
  }
  const secondaryProperties = filteredSectionProperties.filter(
    (property) => !PRIMARY_STYLE_PROPERTIES.has(property),
  );
  const groupedSecondaryProperties = groupedMoreOptionsProperties(
    section.id,
    secondaryProperties,
  );
  const visibleProperties =
    primaryProperties.length > 0
      ? primaryProperties
      : filteredSectionProperties;
  return {
    filteredSectionProperties,
    groupedSecondaryProperties,
    primaryProperties,
    secondaryProperties,
    sectionProperties,
    visibleProperties,
  };
}

const COLOR_CATEGORIES = new Set(["color"]);
const SPACE_SIZE_CATEGORIES = new Set([
  "spacing",
  "space",
  "size",
  "sizing",
  "dimension",
  "dimensions",
  "layout",
  "length",
]);

export function tokenMatchesProperty(
  token: TokenMeta,
  property: StyleProperty,
): boolean {
  const category = token.category.trim().toLowerCase();
  const section = styleSectionForProperty(property);
  if (property === "borderColor") {
    return COLOR_CATEGORIES.has(category) || token.key.startsWith("color.");
  }
  if (property === "borderStyle") {
    return false;
  }
  if (
    property === "overflow" ||
    property === "overflowX" ||
    property === "overflowY"
  ) {
    return false;
  }
  if (section === "color") {
    return COLOR_CATEGORIES.has(category) || token.key.startsWith("color.");
  }
  if (section === "text") {
    return false;
  }
  return (
    SPACE_SIZE_CATEGORIES.has(category) ||
    token.key.startsWith("spacing.") ||
    token.key.startsWith("size.") ||
    token.key.startsWith("sizing.") ||
    token.key.startsWith("dimension.") ||
    token.key.startsWith("layout.")
  );
}

export function tokensForStyleProperty(
  tokenMetadata: TokenMeta[],
  property: StyleProperty,
  selectedTokenKey: string | null,
): TokenMeta[] {
  const propertyTokens = tokenMetadata.filter((token) =>
    tokenMatchesProperty(token, property),
  );
  if (!selectedTokenKey) {
    return propertyTokens;
  }
  const selectedToken = tokenMetadata.find((t) => t.key === selectedTokenKey);
  if (!selectedToken) {
    return propertyTokens;
  }
  if (propertyTokens.some((token) => token.key === selectedToken.key)) {
    return propertyTokens;
  }
  return [selectedToken, ...propertyTokens];
}

export function entrySelectValue(
  entry: StylePropertyEntry | undefined,
): string {
  if (!entry) {
    return NONE_SELECT_VALUE;
  }
  if (entry.type === "token") {
    return `token:${entry.token}`;
  }
  return `utility:${entry.value}`;
}
