"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import {
  type CompositionNode,
  EDITOR_FIELD_TYPES,
  type EditorFieldSpec,
  EditorFieldSpecSchema,
  type PageComposition,
  type StyleProperty,
  type StylePropertyEntry,
  utilityValuesForStyleProperty,
} from "@repo/contracts-zod";
import {
  type StyleSectionId,
  stylePropertiesBySectionForDefinitionKey,
  stylePropertyDefaultValueLabel,
  stylePropertyLabel,
  styleSectionForProperty,
  styleSectionLabel,
} from "@repo/domains-composition";
import type { Icon } from "@tabler/icons-react";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconArrowsHorizontal,
  IconArrowsSplit2,
  IconArrowsVertical,
  IconBorderStyle2,
  IconChevronDown,
  IconChevronRight,
  IconLayout2,
  IconLayoutAlignBottom,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignMiddle,
  IconLayoutAlignRight,
  IconLayoutAlignTop,
  IconLayoutDistributeHorizontal,
  IconPalette,
  IconRestore,
  IconRulerMeasure,
  IconSpacingHorizontal,
  IconTypography,
  IconX,
} from "@tabler/icons-react";
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import { StudioBulkCollapseButton } from "../../components/studio-panel.js";
import { Button } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover.js";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.js";
import { TooltipProvider } from "../../components/ui/tooltip.js";
import { type MediaListItem, fetchMediaRecords } from "../../lib/cms-media.js";
import { cn } from "../../lib/cn.js";
import {
  type PayloadCollectionDocRef,
  fetchPayloadCollectionDocs,
} from "../../lib/fetch-payload-collection-docs.js";
import type { StudioInspectorTab } from "../../lib/inspector-tab-shortcuts.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import {
  libraryDisplayNameForKey,
  useLibraryComponentLabels,
} from "../../lib/use-library-component-labels.js";
import { BoxPrimitiveBackgroundImageSection } from "./box-primitive-background-image-section.js";
import { CollectionFieldBindingSection } from "./collection-field-binding-controls.js";
import { CollectionPrimitiveInspector } from "./collection-primitive-inspector.js";
import {
  IMAGE_PRIMITIVE_MEDIA_KEYS,
  ImageSourcePayloadInspectorFields,
  parseMediaIdFromPropValues,
} from "./image-source-payload-inspector.js";
import { PayloadMediaPickerFields } from "./payload-media-picker-fields.js";
import {
  BorderPropertyRowLabel,
  PropertyControlLabel,
  SettingsCheckboxFieldRow,
  SettingsFieldRow,
} from "./property-control-label.js";

function semanticShellTagForNode(
  node: CompositionNode,
): "header" | "main" | "footer" | null {
  if (node.definitionKey !== "primitive.box") {
    return null;
  }
  const tag = node.propValues?.tag;
  return tag === "header" || tag === "main" || tag === "footer" ? tag : null;
}

function boxSupportsDivSectionElementSetting(tag: unknown): boolean {
  if (tag === undefined || tag === null || tag === "") {
    return true;
  }
  return tag === "div" || tag === "section";
}

function isNodeCollectionFieldMapped(node: CompositionNode): boolean {
  return (
    node.contentBinding?.source === "collection" &&
    typeof node.contentBinding.key === "string" &&
    node.contentBinding.key.trim() !== ""
  );
}

function BoxPrimitiveInspector({
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const baseId = useId();
  if (node.definitionKey !== "primitive.box") {
    return null;
  }
  if (!boxSupportsDivSectionElementSetting(node.propValues?.tag)) {
    return null;
  }
  const rawTag = node.propValues?.tag;
  const element = rawTag === "section" ? "section" : "div";

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-box-element`}
        label="Element"
        onResetProp={resetNodePropKey}
        propKey="tag"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) =>
            patchNodeProps({ tag: value === "section" ? "section" : "div" })
          }
          value={element}
        >
          <SelectTrigger id={`${baseId}-box-element`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="div">div</SelectItem>
            <SelectItem value="section">section</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
    </div>
  );
}

function readStyleProperty(
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

function nodeHasNonEmptyStyleBinding(
  composition: PageComposition,
  node: CompositionNode,
): boolean {
  if (!node.styleBindingId) {
    return false;
  }
  const sb = composition.styleBindings[node.styleBindingId];
  return (sb?.properties.length ?? 0) > 0;
}

const NONE_SELECT_VALUE = "__none__";

function utilityValueLabel(property: StyleProperty, value: string): string {
  if (property === "display" && value === "hidden") {
    return "hidden (display: none)";
  }
  return value;
}

function stylePropertyDefaultOptionLabel(property: StyleProperty): string {
  return stylePropertyDefaultValueLabel(property);
}

function tokenSemanticLabel(tokenKey: string): string {
  const parts = tokenKey.split(".").filter(Boolean);
  const semanticParts =
    parts[0] === "color" && parts.length > 1 ? parts.slice(1) : parts;
  return semanticParts
    .map((part) =>
      part
        .split("-")
        .filter(Boolean)
        .map((word) =>
          /^\d+$/.test(word)
            ? word
            : `${word.charAt(0).toUpperCase()}${word.slice(1)}`,
        )
        .join(" "),
    )
    .join(" ");
}

function isColorStyleProperty(property: StyleProperty): boolean {
  return (
    styleSectionForProperty(property) === "color" || property === "borderColor"
  );
}

function colorSwatchStyleForUtility(value: string): {
  backgroundColor: string;
  opacity?: number;
} {
  if (value === "transparent") {
    return { backgroundColor: "transparent" };
  }
  if (value === "current") {
    return { backgroundColor: "currentColor" };
  }
  if (value === "inherit") {
    return { backgroundColor: "inherit" };
  }
  if (value.startsWith("[") && value.endsWith("]")) {
    return { backgroundColor: value.slice(1, -1) };
  }
  const [base, alpha] = value.split("/");
  const opacity =
    alpha && /^\d+$/.test(alpha) ? Number(alpha) / 100 : undefined;
  return {
    backgroundColor: `var(--color-${base})`,
    opacity,
  };
}

function ColorOptionLabel({
  label,
  style,
}: {
  label: string;
  style: { backgroundColor: string; opacity?: number };
}) {
  return (
    <span className="inline-flex items-center gap-2 leading-none">
      <span
        aria-hidden
        className="size-5 shrink-0 rounded-sm border border-border/70"
        style={style}
      />
      <span className="leading-none">{label}</span>
    </span>
  );
}

const FLEX_UTILITY_META: Partial<
  Record<StyleProperty, Record<string, { label: string; Icon: Icon }>>
> = {
  flexDirection: {
    row: { label: "Row", Icon: IconArrowRight },
    "row-reverse": { label: "Row reverse", Icon: IconArrowLeft },
    col: { label: "Column", Icon: IconArrowDown },
    "col-reverse": { label: "Column reverse", Icon: IconArrowUp },
  },
  flexWrap: {
    wrap: { label: "Wrap", Icon: IconArrowsSplit2 },
    "wrap-reverse": { label: "Wrap reverse", Icon: IconArrowsHorizontal },
    nowrap: { label: "No wrap", Icon: IconArrowRight },
  },
  justifyContent: {
    start: { label: "Start", Icon: IconLayoutAlignLeft },
    end: { label: "End", Icon: IconLayoutAlignRight },
    center: { label: "Center", Icon: IconLayoutAlignCenter },
    between: { label: "Space between", Icon: IconLayoutDistributeHorizontal },
    around: { label: "Space around", Icon: IconLayoutAlignMiddle },
    evenly: { label: "Space evenly", Icon: IconArrowsHorizontal },
  },
  alignItems: {
    start: { label: "Start", Icon: IconLayoutAlignTop },
    end: { label: "End", Icon: IconLayoutAlignBottom },
    center: { label: "Center", Icon: IconLayoutAlignMiddle },
    baseline: { label: "Baseline", Icon: IconLayoutAlignBottom },
    stretch: { label: "Stretch", Icon: IconArrowsVertical },
  },
  alignSelf: {
    auto: { label: "Auto", Icon: IconLayoutAlignCenter },
    start: { label: "Start", Icon: IconLayoutAlignTop },
    end: { label: "End", Icon: IconLayoutAlignBottom },
    center: { label: "Center", Icon: IconLayoutAlignMiddle },
    stretch: { label: "Stretch", Icon: IconArrowsVertical },
    baseline: { label: "Baseline", Icon: IconLayoutAlignBottom },
  },
};

function renderUtilityOptionLabel(property: StyleProperty, value: string) {
  if (isColorStyleProperty(property)) {
    return (
      <ColorOptionLabel
        label={utilityValueLabel(property, value)}
        style={colorSwatchStyleForUtility(value)}
      />
    );
  }
  const flexMeta = FLEX_UTILITY_META[property]?.[value];
  if (!flexMeta) {
    return utilityValueLabel(property, value);
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <flexMeta.Icon aria-hidden className="size-3.5 text-muted-foreground" />
      <span>{flexMeta.label}</span>
    </span>
  );
}

type FlexIconProperty =
  | "flexDirection"
  | "flexWrap"
  | "justifyContent"
  | "alignItems"
  | "alignSelf";

function isFlexIconProperty(
  property: StyleProperty,
): property is FlexIconProperty {
  return (
    property === "flexDirection" ||
    property === "flexWrap" ||
    property === "justifyContent" ||
    property === "alignItems" ||
    property === "alignSelf"
  );
}

function controlOptionButtonClass({
  selected,
  iconOnly,
}: {
  selected: boolean;
  iconOnly: boolean;
}): string {
  return cn(
    "inline-flex h-10 items-center justify-center rounded-md transition-colors",
    iconOnly
      ? "size-10 p-0"
      : "min-w-10 whitespace-nowrap px-2 text-xs font-medium",
    selected
      ? "bg-primary/12 text-primary"
      : "bg-background hover:bg-accent/40",
  );
}

type SpacingSideProperty =
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft";

type SpacingShorthandProperty = "padding" | "margin";
type SpacingControlProperty = SpacingSideProperty | SpacingShorthandProperty;
type SpacingSideKey = "top" | "right" | "bottom" | "left";

type SpacingSideMap = Record<SpacingSideKey, SpacingSideProperty>;

const SPACING_SIDE_MAP: Record<SpacingShorthandProperty, SpacingSideMap> = {
  margin: {
    top: "marginTop",
    right: "marginRight",
    bottom: "marginBottom",
    left: "marginLeft",
  },
  padding: {
    top: "paddingTop",
    right: "paddingRight",
    bottom: "paddingBottom",
    left: "paddingLeft",
  },
};

const SPACING_SIDE_KEYS: readonly SpacingSideKey[] = [
  "top",
  "right",
  "bottom",
  "left",
];

const SPACING_SIDE_LABEL: Record<SpacingSideKey, string> = {
  top: "Top",
  right: "Right",
  bottom: "Bottom",
  left: "Left",
};

const SPACING_SIDE_SHORT_LABEL: Record<SpacingSideKey, string> = {
  top: "T",
  right: "R",
  bottom: "B",
  left: "L",
};

const SPACING_SIDE_POSITION_CLASS: Record<SpacingSideKey, string> = {
  top: "col-start-2 row-start-1",
  right: "col-start-3 row-start-2",
  bottom: "col-start-2 row-start-3",
  left: "col-start-1 row-start-2",
};

const SPACING_RING_PROPERTIES = new Set<StyleProperty>([
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

function spacingEntryDisplayValue(
  sideEntry: StylePropertyEntry | undefined,
  shorthandEntry: StylePropertyEntry | undefined,
): string {
  const entry = sideEntry ?? shorthandEntry;
  if (!entry) {
    return "0";
  }
  if (entry.type === "utility") {
    return entry.value;
  }
  return "token";
}

function spacingEntryUtilityValue(
  entry: StylePropertyEntry | undefined,
): string | null {
  return entry?.type === "utility" ? entry.value : null;
}

function spacingGroupDisplayValue(
  entries: readonly (StylePropertyEntry | undefined)[],
  fallbackEntry: StylePropertyEntry | undefined,
): string {
  if (entries.length === 0) {
    return "0";
  }
  const values = entries.map((entry) =>
    spacingEntryDisplayValue(entry, fallbackEntry),
  );
  return values.every((value) => value === values[0]) ? values[0] : "mix";
}

function spacingGroupSelectedUtilityValue(
  entries: readonly (StylePropertyEntry | undefined)[],
  fallbackEntry: StylePropertyEntry | undefined,
): string | null {
  if (entries.length === 0) {
    return null;
  }
  const resolvedEntries = entries.map((entry) => entry ?? fallbackEntry);
  const first = resolvedEntries[0];
  if (!first || first.type !== "utility") {
    return null;
  }
  return resolvedEntries.every(
    (entry) => entry?.type === "utility" && entry.value === first.value,
  )
    ? first.value
    : null;
}

function spacingAxisDisabled(
  shorthandProperty: SpacingShorthandProperty,
  axisMode: "horizontal" | "vertical",
  availableProperties: ReadonlySet<StyleProperty>,
): boolean {
  const sides = SPACING_SIDE_MAP[shorthandProperty];
  if (axisMode === "horizontal") {
    return !(
      availableProperties.has(sides.left) &&
      availableProperties.has(sides.right)
    );
  }
  return !(
    availableProperties.has(sides.top) && availableProperties.has(sides.bottom)
  );
}

function SpacingGroupPopover({
  title,
  optionPrefix,
  valueProperty,
  targetProperties,
  targetEntries,
  fallbackEntry,
  disabled,
  triggerClassName,
  onNodeStyleEntry,
}: {
  title: string;
  optionPrefix: string;
  valueProperty: SpacingShorthandProperty;
  targetProperties: readonly SpacingControlProperty[];
  targetEntries: readonly (StylePropertyEntry | undefined)[];
  fallbackEntry: StylePropertyEntry | undefined;
  disabled: boolean;
  triggerClassName?: string;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const utilityValues = utilityValuesForStyleProperty(valueProperty);
  const displayValue = spacingGroupDisplayValue(targetEntries, fallbackEntry);
  const triggerLabel = `${optionPrefix}-${displayValue}`;
  const selectedValue = spacingGroupSelectedUtilityValue(
    targetEntries,
    fallbackEntry,
  );
  const hasOverride =
    targetEntries.some((entry) => Boolean(entry)) || Boolean(fallbackEntry);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-sm border bg-background px-2 text-[11px] font-semibold leading-none hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50",
            hasOverride
              ? "border-primary/45 ring-1 ring-primary/25"
              : "border-border/70",
            triggerClassName,
          )}
          disabled={disabled}
          title={`${title}: ${triggerLabel}`}
          type="button"
        >
          <span className="truncate font-mono">{triggerLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-40 p-1.5">
        <ScrollArea className="h-64 pr-1">
          <div className="space-y-1">
            <button
              className="w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-accent/50"
              onClick={() => {
                for (const property of targetProperties) {
                  onNodeStyleEntry(property, null);
                }
                setOpen(false);
              }}
              type="button"
            >
              Unset {title}
            </button>
            {utilityValues.map((value) => {
              const selected = selectedValue === value;
              return (
                <button
                  className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/50"
                  }`}
                  key={`${optionPrefix}-${value}`}
                  onClick={() => {
                    for (const property of targetProperties) {
                      onNodeStyleEntry(property, {
                        type: "utility",
                        property,
                        value,
                      });
                    }
                    setOpen(false);
                  }}
                  type="button"
                >
                  {`${optionPrefix}-${value}`}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function SpacingSidePopover({
  sideProperty,
  shorthandProperty,
  sideLabel,
  sideEntry,
  shorthandEntry,
  disabled,
  onNodeStyleEntry,
}: {
  sideProperty: SpacingSideProperty;
  shorthandProperty: SpacingShorthandProperty;
  sideLabel: string;
  sideEntry: StylePropertyEntry | undefined;
  shorthandEntry: StylePropertyEntry | undefined;
  disabled: boolean;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const utilityValues = utilityValuesForStyleProperty(sideProperty);
  const displayValue = spacingEntryDisplayValue(sideEntry, shorthandEntry);
  const sidePrefix = `${shorthandProperty === "padding" ? "p" : "m"}${sideLabel.toLowerCase()[0]}`;
  const triggerLabel = `${sidePrefix}-${displayValue}`;
  const selectedValue =
    spacingEntryUtilityValue(sideEntry) ??
    spacingEntryUtilityValue(shorthandEntry);
  const hasOverride = Boolean(sideEntry ?? shorthandEntry);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className={`inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-sm border bg-background px-2 text-[11px] font-semibold leading-none hover:bg-accent/40 disabled:cursor-not-allowed disabled:opacity-50 ${
            hasOverride
              ? "border-primary/45 ring-1 ring-primary/25"
              : "border-border/70"
          }`}
          disabled={disabled}
          title={`${sideLabel}: ${triggerLabel}`}
          type="button"
        >
          <span className="truncate font-mono">{triggerLabel}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-40 p-1.5">
        <ScrollArea className="h-64 pr-1">
          <div className="space-y-1">
            <button
              className="w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-accent/50"
              onClick={() => {
                onNodeStyleEntry(sideProperty, null);
                setOpen(false);
              }}
              type="button"
            >
              Unset {sideLabel}
            </button>
            {utilityValues.map((value) => {
              const selected = selectedValue === value;
              return (
                <button
                  className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/50"
                  }`}
                  key={`${sideProperty}-${value}`}
                  onClick={() => {
                    onNodeStyleEntry(sideProperty, {
                      type: "utility",
                      property: sideProperty,
                      value,
                    });
                    setOpen(false);
                  }}
                  type="button"
                >
                  {`${sidePrefix}-${value}`}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function SpacingPropertyPanel({
  shorthandProperty,
  composition,
  node,
  availableProperties,
  onNodeStyleEntry,
}: {
  shorthandProperty: SpacingShorthandProperty;
  composition: PageComposition;
  node: CompositionNode;
  availableProperties: ReadonlySet<StyleProperty>;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const sideMap = SPACING_SIDE_MAP[shorthandProperty];
  const shorthandEntry = readStyleProperty(
    composition,
    node,
    shorthandProperty,
  );
  const sideEntries: Record<SpacingSideKey, StylePropertyEntry | undefined> = {
    top: readStyleProperty(composition, node, sideMap.top),
    right: readStyleProperty(composition, node, sideMap.right),
    bottom: readStyleProperty(composition, node, sideMap.bottom),
    left: readStyleProperty(composition, node, sideMap.left),
  };
  const horizontalDisabled = spacingAxisDisabled(
    shorthandProperty,
    "horizontal",
    availableProperties,
  );
  const verticalDisabled = spacingAxisDisabled(
    shorthandProperty,
    "vertical",
    availableProperties,
  );
  const baseLabel = shorthandProperty === "padding" ? "Padding" : "Margin";
  const basePrefix = shorthandProperty === "padding" ? "p" : "m";
  const allTargetProperties: SpacingControlProperty[] = [
    shorthandProperty,
    sideMap.top,
    sideMap.right,
    sideMap.bottom,
    sideMap.left,
  ].filter((property) => availableProperties.has(property));
  const allDisabled = allTargetProperties.length === 0;
  const hasAnySpacingOverride =
    Boolean(shorthandEntry) ||
    SPACING_SIDE_KEYS.some((side) => Boolean(sideEntries[side]));
  const [targetMode, setTargetMode] = useState<"sides" | "axis" | "all">(
    "axis",
  );

  return (
    <div className="space-y-3 rounded-md border border-border/70 bg-background/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <Select
          onValueChange={(value) => {
            if (value === "sides" || value === "axis" || value === "all") {
              setTargetMode(value);
            }
          }}
          value={targetMode}
        >
          <SelectTrigger
            aria-label={`${baseLabel} value target`}
            className="h-8 w-[80px] text-xs font-medium"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sides">Sides</SelectItem>
            <SelectItem value="axis">Axis</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        {hasAnySpacingOverride ? (
          <div className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="inline-flex size-1.5 shrink-0 rounded-full bg-primary"
              title="Changed from default"
            />
            <Button
              aria-label={`Reset ${baseLabel.toLowerCase()} spacing`}
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => {
                for (const property of allTargetProperties) {
                  onNodeStyleEntry(property, null);
                }
              }}
              type="button"
              variant="ghost"
            >
              <IconRestore className="size-3.5" stroke={1.6} />
            </Button>
          </div>
        ) : null}
      </div>
      {targetMode === "all" ? (
        <SpacingGroupPopover
          disabled={allDisabled}
          fallbackEntry={shorthandEntry}
          onNodeStyleEntry={onNodeStyleEntry}
          optionPrefix={basePrefix}
          targetEntries={[
            sideEntries.top,
            sideEntries.right,
            sideEntries.bottom,
            sideEntries.left,
          ]}
          targetProperties={allTargetProperties}
          title={`${baseLabel} all sides`}
          triggerClassName="w-full"
          valueProperty={shorthandProperty}
        />
      ) : targetMode === "axis" ? (
        <div className="grid grid-cols-2 gap-2">
          <SpacingGroupPopover
            disabled={horizontalDisabled}
            fallbackEntry={shorthandEntry}
            onNodeStyleEntry={onNodeStyleEntry}
            optionPrefix={`${basePrefix}x`}
            targetEntries={[sideEntries.left, sideEntries.right]}
            targetProperties={[sideMap.left, sideMap.right]}
            title={`${baseLabel} horizontal`}
            triggerClassName="w-full"
            valueProperty={shorthandProperty}
          />
          <SpacingGroupPopover
            disabled={verticalDisabled}
            fallbackEntry={shorthandEntry}
            onNodeStyleEntry={onNodeStyleEntry}
            optionPrefix={`${basePrefix}y`}
            targetEntries={[sideEntries.top, sideEntries.bottom]}
            targetProperties={[sideMap.top, sideMap.bottom]}
            title={`${baseLabel} vertical`}
            triggerClassName="w-full"
            valueProperty={shorthandProperty}
          />
        </div>
      ) : (
        <div className="mx-auto grid w-[252px] grid-cols-3 grid-rows-3 gap-2">
          <div className="col-start-2 row-start-2 flex h-8 items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/20 text-[10px] font-semibold uppercase text-muted-foreground">
            {basePrefix}
          </div>
          {SPACING_SIDE_KEYS.map((side) => {
            const sideProperty = sideMap[side];
            return (
              <div
                className={cn(
                  "flex items-center justify-center",
                  SPACING_SIDE_POSITION_CLASS[side],
                )}
                key={`${shorthandProperty}-${side}`}
              >
                <SpacingSidePopover
                  disabled={!availableProperties.has(sideProperty)}
                  onNodeStyleEntry={onNodeStyleEntry}
                  shorthandEntry={shorthandEntry}
                  shorthandProperty={shorthandProperty}
                  sideEntry={sideEntries[side]}
                  sideLabel={SPACING_SIDE_LABEL[side]}
                  sideProperty={sideProperty}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SpacingBoxControl({
  composition,
  node,
  availableProperties,
  onNodeStyleEntry,
}: {
  composition: PageComposition;
  node: CompositionNode;
  availableProperties: ReadonlySet<StyleProperty>;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [activeProperty, setActiveProperty] =
    useState<SpacingShorthandProperty>("margin");

  return (
    <Tabs
      className="w-full"
      onValueChange={(nextValue) => {
        if (nextValue === "margin" || nextValue === "padding") {
          setActiveProperty(nextValue);
        }
      }}
      value={activeProperty}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="margin">Margin</TabsTrigger>
        <TabsTrigger value="padding">Padding</TabsTrigger>
      </TabsList>
      <TabsContent className="mt-3" value="margin">
        <SpacingPropertyPanel
          availableProperties={availableProperties}
          composition={composition}
          node={node}
          onNodeStyleEntry={onNodeStyleEntry}
          shorthandProperty="margin"
        />
      </TabsContent>
      <TabsContent className="mt-3" value="padding">
        <SpacingPropertyPanel
          availableProperties={availableProperties}
          composition={composition}
          node={node}
          onNodeStyleEntry={onNodeStyleEntry}
          shorthandProperty="padding"
        />
      </TabsContent>
    </Tabs>
  );
}

type BorderSideKey = "all" | "top" | "right" | "bottom" | "left";

function styleEntryTriggerCaption(
  property: StyleProperty,
  valueEntry: StylePropertyEntry | undefined,
): string {
  if (!valueEntry) {
    return stylePropertyDefaultValueLabel(property);
  }
  if (valueEntry.type === "utility") {
    return valueEntry.value;
  }
  return tokenSemanticLabel(valueEntry.token);
}

function BorderSideGlyphIcon({ side }: { side: BorderSideKey }) {
  if (side === "all") {
    return (
      <span className="inline-block size-[18px] rounded-[3px] border-2 border-current opacity-80" />
    );
  }
  return (
    <span className="relative inline-flex size-[18px] items-center justify-center text-foreground">
      <span className="absolute inset-[2px] rounded-[1px] border border-muted-foreground/40" />
      {side === "top" ? (
        <span className="absolute left-[2px] right-[2px] top-[2px] h-[2.5px] rounded-[1px] bg-current" />
      ) : side === "bottom" ? (
        <span className="absolute bottom-[2px] left-[2px] right-[2px] h-[2.5px] rounded-[1px] bg-current" />
      ) : side === "left" ? (
        <span className="absolute bottom-[2px] left-[2px] top-[2px] w-[2.5px] rounded-[1px] bg-current" />
      ) : (
        <span className="absolute bottom-[2px] right-[2px] top-[2px] w-[2.5px] rounded-[1px] bg-current" />
      )}
    </span>
  );
}

function BorderSideSelector({
  selected,
  onSelect,
}: {
  selected: BorderSideKey;
  onSelect: (side: BorderSideKey) => void;
}) {
  const Btn = ({
    side,
    label,
  }: {
    side: BorderSideKey;
    label: string;
  }) => {
    const isOn = selected === side;
    return (
      <button
        aria-label={label}
        aria-pressed={isOn}
        className={`inline-flex size-9 items-center justify-center rounded-md border transition-colors ${
          isOn
            ? "border-primary bg-primary/15 text-primary"
            : "border-border/70 bg-background text-muted-foreground hover:bg-accent/40"
        }`}
        onClick={() => onSelect(side)}
        type="button"
      >
        <BorderSideGlyphIcon side={side} />
      </button>
    );
  };

  return (
    <fieldset className="m-0 flex min-w-0 shrink-0 flex-col items-center gap-1 border-0 p-0">
      <Btn label="Border top" side="top" />
      <div className="flex items-center gap-1">
        <Btn label="Border left" side="left" />
        <Btn label="Border all sides" side="all" />
        <Btn label="Border right" side="right" />
      </div>
      <Btn label="Border bottom" side="bottom" />
    </fieldset>
  );
}

function borderStyleSegmentIcon(utility: string) {
  switch (utility) {
    case "none":
      return <IconX aria-hidden className="size-4" stroke={2} />;
    case "solid":
      return <span aria-hidden className="block h-0.5 w-5 bg-current" />;
    case "dashed":
      return (
        <span
          aria-hidden
          className="block w-5 border-t-2 border-dashed border-current"
        />
      );
    case "dotted":
      return (
        <span
          aria-hidden
          className="block w-5 border-t-2 border-dotted border-current"
        />
      );
    case "double":
      return (
        <span
          aria-hidden
          className="flex h-3 w-5 flex-col justify-center gap-0.5"
        >
          <span className="h-0.5 w-full bg-current" />
          <span className="h-0.5 w-full bg-current" />
        </span>
      );
    case "hidden":
      return (
        <span
          aria-hidden
          className="text-[10px] font-bold leading-none text-current"
        >
          ∅
        </span>
      );
    default:
      return (
        <span className="max-w-[3rem] truncate text-[10px] font-medium">
          {utility}
        </span>
      );
  }
}

function BorderStyleUtilityChips({
  valueEntry,
  onNodeStyleEntry,
}: {
  valueEntry: StylePropertyEntry | undefined;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const property = "borderStyle" as const;
  const utilities = utilityValuesForStyleProperty(property);
  const selectedUtility =
    valueEntry?.type === "utility" ? valueEntry.value : null;

  return (
    <div className="flex min-w-0 flex-1 flex-wrap justify-end gap-1">
      {utilities.map((value) => {
        const pressed = selectedUtility === value;
        return (
          <button
            aria-label={utilityValueLabel(property, value)}
            aria-pressed={pressed}
            className={`inline-flex size-9 items-center justify-center rounded-md border transition-colors ${
              pressed
                ? "border-primary bg-primary/12 text-primary"
                : "border-border/60 bg-background text-muted-foreground hover:bg-accent/40"
            }`}
            key={value}
            onClick={() =>
              onNodeStyleEntry(property, {
                type: "utility",
                property,
                value,
              })
            }
            title={utilityValueLabel(property, value)}
            type="button"
          >
            {borderStyleSegmentIcon(value)}
          </button>
        );
      })}
    </div>
  );
}

function BorderWidthUtilityPopover({
  valueEntry,
  tokenMetadata,
  onNodeStyleEntry,
}: {
  valueEntry: StylePropertyEntry | undefined;
  tokenMetadata: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const property = "borderWidth" as const;
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const visibleTokens = tokensForStyleProperty(
    tokenMetadata,
    property,
    selectedToken,
  );
  const utilityValues = utilityValuesForStyleProperty(property);
  const selectedUtility =
    valueEntry?.type === "utility" ? valueEntry.value : null;

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex h-9 min-w-0 max-w-full flex-1 items-center justify-center rounded-md border border-border/60 bg-background px-2 font-mono text-xs font-medium tabular-nums hover:bg-accent/30"
          title={stylePropertyLabel(property)}
          type="button"
        >
          <span className="truncate">
            {styleEntryTriggerCaption(property, valueEntry)}
          </span>
          <IconChevronDown
            aria-hidden
            className="ml-1 size-3.5 shrink-0 opacity-50"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <ScrollArea className="max-h-64 pr-1">
          <div className="space-y-1">
            <button
              className="w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-accent/50"
              onClick={() => {
                onNodeStyleEntry(property, null);
                setOpen(false);
              }}
              type="button"
            >
              {stylePropertyDefaultOptionLabel(property)}
            </button>
            {utilityValues.map((value) => {
              const selected = selectedUtility === value;
              return (
                <button
                  className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/50"
                  }`}
                  key={value}
                  onClick={() => {
                    onNodeStyleEntry(property, {
                      type: "utility",
                      property,
                      value,
                    });
                    setOpen(false);
                  }}
                  type="button"
                >
                  {renderUtilityOptionLabel(property, value)}
                </button>
              );
            })}
            {visibleTokens.length > 0 ? (
              <>
                <div className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tokens
                </div>
                {visibleTokens.map((token) => {
                  const selected = selectedToken === token.key;
                  return (
                    <button
                      className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent/50"
                      }`}
                      key={token.key}
                      onClick={() => {
                        onNodeStyleEntry(property, {
                          type: "token",
                          property,
                          token: token.key,
                        });
                        setOpen(false);
                      }}
                      type="button"
                    >
                      {tokenSemanticLabel(token.key)}
                    </button>
                  );
                })}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function BorderColorField({
  valueEntry,
  tokenMetadata,
  onNodeStyleEntry,
}: {
  valueEntry: StylePropertyEntry | undefined;
  tokenMetadata: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const property = "borderColor" as const;
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const visibleTokens = tokensForStyleProperty(
    tokenMetadata,
    property,
    selectedToken,
  );
  const utilityValues = utilityValuesForStyleProperty(property);
  const selectedUtility =
    valueEntry?.type === "utility" ? valueEntry.value : null;
  const tokenMetaForSelected = selectedToken
    ? tokenMetadata.find((t) => t.key === selectedToken)
    : undefined;

  const displayLabel = (() => {
    if (!valueEntry) {
      return stylePropertyDefaultValueLabel(property);
    }
    if (valueEntry.type === "utility") {
      return utilityValueLabel(property, valueEntry.value);
    }
    return tokenSemanticLabel(valueEntry.token);
  })();

  const swatchStyle = (() => {
    if (!valueEntry) {
      return { backgroundColor: "transparent" as const };
    }
    if (valueEntry.type === "utility") {
      return colorSwatchStyleForUtility(valueEntry.value);
    }
    return {
      backgroundColor: tokenMetaForSelected
        ? `var(${tokenMetaForSelected.cssVar})`
        : "transparent",
    };
  })();

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className="flex min-h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-left text-sm hover:bg-accent/30"
          type="button"
        >
          <span
            aria-hidden
            className="size-6 shrink-0 rounded border border-border/70"
            style={swatchStyle}
          />
          <span className="min-w-0 flex-1 truncate text-sm">
            {displayLabel}
          </span>
          <IconChevronDown
            aria-hidden
            className="size-3.5 shrink-0 opacity-50"
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <ScrollArea className="max-h-64 pr-1">
          <div className="space-y-1">
            <button
              className="w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-accent/50"
              onClick={() => {
                onNodeStyleEntry(property, null);
                setOpen(false);
              }}
              type="button"
            >
              {stylePropertyDefaultOptionLabel(property)}
            </button>
            {utilityValues.map((value) => {
              const selected = selectedUtility === value;
              return (
                <button
                  className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                    selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/50"
                  }`}
                  key={value}
                  onClick={() => {
                    onNodeStyleEntry(property, {
                      type: "utility",
                      property,
                      value,
                    });
                    setOpen(false);
                  }}
                  type="button"
                >
                  {renderUtilityOptionLabel(property, value)}
                </button>
              );
            })}
            {visibleTokens.length > 0 ? (
              <>
                <div className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Tokens
                </div>
                {visibleTokens.map((token) => {
                  const selected = selectedToken === token.key;
                  return (
                    <button
                      className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent/50"
                      }`}
                      key={token.key}
                      onClick={() => {
                        onNodeStyleEntry(property, {
                          type: "token",
                          property,
                          token: token.key,
                        });
                        setOpen(false);
                      }}
                      type="button"
                    >
                      <ColorOptionLabel
                        label={tokenSemanticLabel(token.key)}
                        style={{ backgroundColor: `var(${token.cssVar})` }}
                      />
                    </button>
                  );
                })}
              </>
            ) : null}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function BorderRadiusUtilityAndTokenRow({
  valueEntry,
  tokenMetadata,
  onNodeStyleEntry,
}: {
  valueEntry: StylePropertyEntry | undefined;
  tokenMetadata: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const property = "borderRadius" as const;
  const values = utilityValuesForStyleProperty(property);
  const selectedUtility =
    valueEntry?.type === "utility" ? valueEntry.value : null;
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const visibleTokens = tokensForStyleProperty(
    tokenMetadata,
    property,
    selectedToken,
  );
  const [tokenOpen, setTokenOpen] = useState(false);

  return (
    <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-1">
      {values.map((value) => {
        const pressed = selectedUtility === value && !selectedToken;
        return (
          <button
            className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
              pressed
                ? "border-primary bg-primary/12 text-primary"
                : "border-border/60 bg-background text-muted-foreground hover:bg-accent/40"
            }`}
            key={value}
            onClick={() =>
              onNodeStyleEntry(property, {
                type: "utility",
                property,
                value,
              })
            }
            type="button"
          >
            {renderUtilityOptionLabel(property, value)}
          </button>
        );
      })}
      {visibleTokens.length > 0 ? (
        <Popover onOpenChange={setTokenOpen} open={tokenOpen}>
          <PopoverTrigger asChild>
            <button
              className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                selectedToken
                  ? "border-primary bg-primary/12 text-primary"
                  : "border-border/60 bg-background text-muted-foreground hover:bg-accent/40"
              }`}
              type="button"
            >
              Token
              <IconChevronDown aria-hidden className="ml-0.5 inline size-3" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1.5">
            <ScrollArea className="max-h-64 pr-1">
              <div className="space-y-1">
                <button
                  className="w-full rounded-sm px-2 py-1 text-left text-xs hover:bg-accent/50"
                  onClick={() => {
                    onNodeStyleEntry(property, null);
                    setTokenOpen(false);
                  }}
                  type="button"
                >
                  {stylePropertyDefaultOptionLabel(property)}
                </button>
                {visibleTokens.map((token) => {
                  const selected = selectedToken === token.key;
                  return (
                    <button
                      className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent/50"
                      }`}
                      key={token.key}
                      onClick={() => {
                        onNodeStyleEntry(property, {
                          type: "token",
                          property,
                          token: token.key,
                        });
                        setTokenOpen(false);
                      }}
                      type="button"
                    >
                      {tokenSemanticLabel(token.key)}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  );
}

function BorderControl({
  composition,
  node,
  tokenMetadata,
  availableProperties,
  onNodeStyleEntry,
}: {
  composition: PageComposition;
  node: CompositionNode;
  tokenMetadata: TokenMeta[];
  availableProperties: ReadonlySet<StyleProperty>;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const radiusProperty = availableProperties.has("borderRadius")
    ? ("borderRadius" as const)
    : null;
  const hasWidth = availableProperties.has("borderWidth");
  const hasStyle = availableProperties.has("borderStyle");
  const hasColor = availableProperties.has("borderColor");
  const showAny = hasWidth || hasStyle || hasColor || Boolean(radiusProperty);

  const [activeSide, setActiveSide] = useState<BorderSideKey>("all");

  if (!showAny) {
    return null;
  }

  const widthEntry = readStyleProperty(composition, node, "borderWidth");
  const styleEntry = readStyleProperty(composition, node, "borderStyle");
  const colorEntry = readStyleProperty(composition, node, "borderColor");
  const radiusEntry = radiusProperty
    ? readStyleProperty(composition, node, radiusProperty)
    : undefined;

  return (
    <div className="rounded-md border border-border/70 bg-background/50 p-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <BorderSideSelector onSelect={setActiveSide} selected={activeSide} />
        <div className="min-w-0 flex-1 space-y-3">
          {hasStyle ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
              <BorderPropertyRowLabel
                onReset={() => onNodeStyleEntry("borderStyle", null)}
                showModified={Boolean(styleEntry)}
              >
                Style
              </BorderPropertyRowLabel>
              <div className="flex justify-end">
                <BorderStyleUtilityChips
                  onNodeStyleEntry={onNodeStyleEntry}
                  valueEntry={styleEntry}
                />
              </div>
            </div>
          ) : null}
          {hasWidth ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
              <BorderPropertyRowLabel
                onReset={() => onNodeStyleEntry("borderWidth", null)}
                showModified={Boolean(widthEntry)}
              >
                Width
              </BorderPropertyRowLabel>
              <BorderWidthUtilityPopover
                onNodeStyleEntry={onNodeStyleEntry}
                tokenMetadata={tokenMetadata}
                valueEntry={widthEntry}
              />
            </div>
          ) : null}
          {hasColor ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-1">
              <BorderPropertyRowLabel
                onReset={() => onNodeStyleEntry("borderColor", null)}
                showModified={Boolean(colorEntry)}
              >
                Color
              </BorderPropertyRowLabel>
              <BorderColorField
                onNodeStyleEntry={onNodeStyleEntry}
                tokenMetadata={tokenMetadata}
                valueEntry={colorEntry}
              />
            </div>
          ) : null}
          {radiusProperty ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-1">
              <BorderPropertyRowLabel
                onReset={() => onNodeStyleEntry("borderRadius", null)}
                showModified={Boolean(radiusEntry)}
              >
                Radius
              </BorderPropertyRowLabel>
              <BorderRadiusUtilityAndTokenRow
                onNodeStyleEntry={onNodeStyleEntry}
                tokenMetadata={tokenMetadata}
                valueEntry={radiusEntry}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function FlexIconStyleValueControl({
  property,
  valueEntry,
  onNodeStyleEntry,
}: {
  property: FlexIconProperty;
  valueEntry: StylePropertyEntry | undefined;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const selectedValue =
    valueEntry?.type === "utility" ? valueEntry.value : null;
  const options = Object.entries(FLEX_UTILITY_META[property] ?? {});

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        <button
          aria-label={`Default ${stylePropertyLabel(property)} (${stylePropertyDefaultValueLabel(property)})`}
          aria-pressed={!valueEntry}
          className={controlOptionButtonClass({
            selected: !valueEntry,
            iconOnly: false,
          })}
          onClick={() => onNodeStyleEntry(property, null)}
          title={`Default: ${stylePropertyDefaultValueLabel(property)}`}
          type="button"
        >
          {stylePropertyDefaultValueLabel(property)}
        </button>
        {options.map(([value, meta]) => {
          const selected = selectedValue === value;
          return (
            <button
              aria-label={meta.label}
              aria-pressed={selected}
              className={controlOptionButtonClass({
                selected,
                iconOnly: true,
              })}
              key={value}
              onClick={() =>
                onNodeStyleEntry(property, {
                  type: "utility",
                  property,
                  value,
                })
              }
              title={meta.label}
              type="button"
            >
              <meta.Icon aria-hidden className="size-5" stroke={1.8} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function isDimensionProperty(
  property: StyleProperty,
): property is "width" | "height" {
  return property === "width" || property === "height";
}

function dimensionValueLabel(
  property: "width" | "height",
  value: string,
): string {
  if (value === "full") {
    return "Fill container";
  }
  if (value === "auto") {
    return property === "width" ? "Hug contents" : "Hug height";
  }
  if (value === "screen") {
    return "Screen";
  }
  if (value === "min") {
    return "Min content";
  }
  if (value === "max") {
    return "Max content";
  }
  if (value === "fit") {
    return "Fit content";
  }
  return value;
}

function dimensionUtilityGroups(values: readonly string[]) {
  const commonValues = new Set(["auto", "full", "screen", "fit", "min", "max"]);
  const containerValues = new Set([
    "3xs",
    "2xs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl",
    "7xl",
    "container",
    "prose",
  ]);

  const common = values.filter((value) => commonValues.has(value));
  const fractions = values.filter((value) => value.includes("/"));
  const containers = values.filter(
    (value) => containerValues.has(value) || value.startsWith("screen-"),
  );
  const scale = values.filter(
    (value) =>
      !commonValues.has(value) &&
      !value.includes("/") &&
      !containerValues.has(value) &&
      !value.startsWith("screen-"),
  );

  return [
    { id: "common", label: "Common", values: common },
    { id: "scale", label: "Scale", values: scale },
    { id: "fractions", label: "Fractions", values: fractions },
    { id: "containers", label: "Containers", values: containers },
  ].filter((group) => group.values.length > 0);
}

function DimensionStyleValueControl({
  property,
  valueEntry,
  utilityValues,
  visibleTokens,
  onNodeStyleEntry,
}: {
  property: "width" | "height";
  valueEntry: StylePropertyEntry | undefined;
  utilityValues: readonly string[];
  visibleTokens: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedUtility =
    valueEntry?.type === "utility" ? valueEntry.value : null;
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const triggerText = valueEntry
    ? valueEntry.type === "utility"
      ? dimensionValueLabel(property, valueEntry.value)
      : tokenSemanticLabel(valueEntry.token)
    : stylePropertyDefaultValueLabel(property);
  const groups = dimensionUtilityGroups(utilityValues);

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <Button
          className="h-10 w-full justify-between rounded-md border border-input bg-background px-2 text-left text-sm font-normal hover:bg-accent/30"
          type="button"
          variant="ghost"
        >
          <span className="truncate">{triggerText}</span>
          <IconChevronDown aria-hidden className="size-3.5 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-2">
        <ScrollArea className="h-[min(20rem,calc(100vh-12rem))]">
          <div className="space-y-2 pr-2">
            <button
              className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent/60"
              onClick={() => {
                onNodeStyleEntry(property, null);
                setOpen(false);
              }}
              type="button"
            >
              <span>{stylePropertyDefaultOptionLabel(property)}</span>
              {!valueEntry ? (
                <IconChevronRight aria-hidden className="size-3.5" />
              ) : null}
            </button>
            {groups.map((group) => (
              <Collapsible
                defaultOpen={
                  group.id === "common" ||
                  group.values.includes(selectedUtility ?? "")
                }
                key={group.id}
              >
                <CollapsibleTrigger asChild>
                  <button
                    className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground hover:bg-accent/40"
                    type="button"
                  >
                    <span>{group.label}</span>
                    <IconChevronDown className="size-3.5 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1">
                  <div className="grid grid-cols-2 gap-1">
                    {group.values.map((value) => {
                      const selected = selectedUtility === value;
                      return (
                        <button
                          className={`rounded-sm border px-2 py-1 text-left text-xs ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/70 hover:bg-accent/40"
                          }`}
                          key={value}
                          onClick={() => {
                            onNodeStyleEntry(property, {
                              type: "utility",
                              property,
                              value,
                            });
                            setOpen(false);
                          }}
                          type="button"
                        >
                          {dimensionValueLabel(property, value)}
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
            {visibleTokens.length > 0 ? (
              <Collapsible defaultOpen={Boolean(selectedToken)}>
                <CollapsibleTrigger asChild>
                  <button
                    className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs font-semibold text-muted-foreground hover:bg-accent/40"
                    type="button"
                  >
                    <span>Tokens</span>
                    <IconChevronDown className="size-3.5 transition-transform data-[state=open]:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-1">
                  <div className="space-y-1">
                    {visibleTokens.map((token) => {
                      const selected = selectedToken === token.key;
                      return (
                        <button
                          className={`w-full rounded-sm border px-2 py-1 text-left text-xs ${
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border/70 hover:bg-accent/40"
                          }`}
                          key={token.key}
                          onClick={() => {
                            onNodeStyleEntry(property, {
                              type: "token",
                              property,
                              token: token.key,
                            });
                            setOpen(false);
                          }}
                          type="button"
                        >
                          {tokenSemanticLabel(token.key)}
                        </button>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ) : null}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

const DISPLAY_QUICK_OPTIONS: readonly {
  id: "block" | "flex" | "grid" | "none";
  value: "block" | "flex" | "grid" | "hidden";
  label: string;
}[] = [
  { id: "block", value: "block", label: "Block" },
  { id: "flex", value: "flex", label: "Flex" },
  { id: "grid", value: "grid", label: "Grid" },
  { id: "none", value: "hidden", label: "None" },
];

function DisplayStyleValueControl({
  valueEntry,
  onNodeStyleEntry,
}: {
  valueEntry: StylePropertyEntry | undefined;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedUtility =
    valueEntry?.type === "utility" ? valueEntry.value : undefined;
  const quickValues = new Set<string>(
    DISPLAY_QUICK_OPTIONS.map((option) => option.value),
  );
  const overflowUtilityValues = utilityValuesForStyleProperty("display").filter(
    (value) => !quickValues.has(value),
  );

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {DISPLAY_QUICK_OPTIONS.map((option) => {
          const selected = selectedUtility === option.value;
          return (
            <button
              aria-pressed={selected}
              className={`inline-flex h-10 items-center justify-center rounded-md px-3 text-xs font-medium transition-colors ${
                selected
                  ? "bg-primary/12 text-primary"
                  : "bg-background hover:bg-accent/40"
              }`}
              key={option.id}
              onClick={() =>
                onNodeStyleEntry("display", {
                  type: "utility",
                  property: "display",
                  value: option.value,
                })
              }
              title={option.label}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <button
              aria-label="More display options"
              className="inline-flex size-10 items-center justify-center rounded-md bg-background text-sm font-semibold hover:bg-accent/40"
              title="More display options"
              type="button"
            >
              ...
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1.5">
            <ScrollArea className="h-64 pr-1">
              <div className="space-y-1">
                <button
                  className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                    !valueEntry
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent/50"
                  }`}
                  onClick={() => {
                    onNodeStyleEntry("display", null);
                    setOpen(false);
                  }}
                  type="button"
                >
                  {stylePropertyDefaultOptionLabel("display")}
                </button>
                {overflowUtilityValues.map((value) => {
                  const selected = selectedUtility === value;
                  return (
                    <button
                      className={`w-full rounded-sm px-2 py-1 text-left text-xs ${
                        selected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent/50"
                      }`}
                      key={value}
                      onClick={() => {
                        onNodeStyleEntry("display", {
                          type: "utility",
                          property: "display",
                          value,
                        });
                        setOpen(false);
                      }}
                      type="button"
                    >
                      {utilityValueLabel("display", value)}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

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

function orderedStyleSectionsForInspector(
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

function groupedMoreOptionsProperties(
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

function moreOptionsGridClassName(sectionId: StyleSectionId): string {
  return GROUPED_MORE_OPTIONS_SECTIONS.has(sectionId)
    ? "grid grid-cols-2 gap-3"
    : "grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4";
}

type InspectorOrderedStyleSection = ReturnType<
  typeof orderedStyleSectionsForInspector
>[number];

function inspectorStyleSectionTopClass(sectionIndex: number): string {
  return sectionIndex === 0 ? "" : "border-t border-border/60 pt-4 ";
}

function collectStyleSectionIdsWithControls(
  orderedSections: InspectorOrderedStyleSection[],
  gapPropertyAvailable: boolean,
): StyleSectionId[] {
  const ids: StyleSectionId[] = [];
  for (const section of orderedSections) {
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
    if (sectionProperties.length > 0) {
      ids.push(section.id);
    }
  }
  return ids;
}

function inspectorStyleSectionModelFromSection(
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
const TYPOGRAPHY_CATEGORIES = new Set([
  "typography",
  "type",
  "font",
  "fonts",
  "text",
]);
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

function tokenMatchesProperty(
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

function tokensForStyleProperty(
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

function entrySelectValue(entry: StylePropertyEntry | undefined): string {
  if (!entry) {
    return NONE_SELECT_VALUE;
  }
  if (entry.type === "token") {
    return `token:${entry.token}`;
  }
  return `utility:${entry.value}`;
}

function StylePropertyTokenUtilityPicker({
  currentValue,
  property,
  utilityValues,
  visibleTokens,
  onNodeStyleEntry,
}: {
  property: StyleProperty;
  utilityValues: readonly string[];
  visibleTokens: TokenMeta[];
  currentValue: string;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  return (
    <Select
      data-testid={`inspector-style-token-${property}`}
      onValueChange={(next) => {
        if (next === NONE_SELECT_VALUE) {
          onNodeStyleEntry(property, null);
          return;
        }
        if (next.startsWith("utility:")) {
          onNodeStyleEntry(property, {
            type: "utility",
            property,
            value: next.slice("utility:".length),
          });
          return;
        }
        if (next.startsWith("token:")) {
          onNodeStyleEntry(property, {
            type: "token",
            property,
            token: next.slice("token:".length),
          });
        }
      }}
      value={currentValue}
    >
      <SelectTrigger id={`style-${property}`}>
        <SelectValue placeholder={stylePropertyDefaultOptionLabel(property)} />
      </SelectTrigger>
      <SelectContent
        className={
          isColorStyleProperty(property)
            ? "**:data-[slot=select-item]:pl-2 [&_[data-slot=select-item]>span.absolute]:hidden"
            : undefined
        }
      >
        <SelectItem value={NONE_SELECT_VALUE}>
          {stylePropertyDefaultOptionLabel(property)}
        </SelectItem>
        {utilityValues.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Tailwind values</SelectLabel>
            {utilityValues.map((value) => (
              <SelectItem key={value} value={`utility:${value}`}>
                {renderUtilityOptionLabel(property, value)}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
        {visibleTokens.length > 0 ? (
          <SelectGroup>
            <SelectLabel>Tokens</SelectLabel>
            {visibleTokens.map((token) => (
              <SelectItem key={token.key} value={`token:${token.key}`}>
                {isColorStyleProperty(property) ? (
                  <ColorOptionLabel
                    label={tokenSemanticLabel(token.key)}
                    style={{ backgroundColor: `var(${token.cssVar})` }}
                  />
                ) : (
                  tokenSemanticLabel(token.key)
                )}
              </SelectItem>
            ))}
          </SelectGroup>
        ) : null}
      </SelectContent>
    </Select>
  );
}

function stylePropertyValueEditor(args: {
  property: StyleProperty;
  valueEntry: StylePropertyEntry | undefined;
  utilityValues: readonly string[];
  visibleTokens: TokenMeta[];
  currentValue: string;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const {
    property,
    valueEntry,
    onNodeStyleEntry,
    utilityValues,
    visibleTokens,
    currentValue,
  } = args;
  if (property === "display") {
    return (
      <DisplayStyleValueControl
        onNodeStyleEntry={onNodeStyleEntry}
        valueEntry={valueEntry}
      />
    );
  }
  if (isDimensionProperty(property)) {
    return (
      <DimensionStyleValueControl
        onNodeStyleEntry={onNodeStyleEntry}
        property={property}
        utilityValues={utilityValues}
        valueEntry={valueEntry}
        visibleTokens={visibleTokens}
      />
    );
  }
  if (isFlexIconProperty(property)) {
    return (
      <FlexIconStyleValueControl
        onNodeStyleEntry={onNodeStyleEntry}
        property={property}
        valueEntry={valueEntry}
      />
    );
  }
  return (
    <StylePropertyTokenUtilityPicker
      currentValue={currentValue}
      onNodeStyleEntry={onNodeStyleEntry}
      property={property}
      utilityValues={utilityValues}
      visibleTokens={visibleTokens}
    />
  );
}

function StyleValueSelect({
  property,
  valueEntry,
  tokenMetadata,
  onNodeStyleEntry,
}: {
  property: StyleProperty;
  valueEntry: StylePropertyEntry | undefined;
  tokenMetadata: TokenMeta[];
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
}) {
  const selectedToken = valueEntry?.type === "token" ? valueEntry.token : null;
  const visibleTokens = tokensForStyleProperty(
    tokenMetadata,
    property,
    selectedToken,
  );
  const utilityValues = utilityValuesForStyleProperty(property);
  const currentValue = entrySelectValue(valueEntry);
  const showModified = Boolean(valueEntry);
  return (
    <div className="block space-y-2" key={property}>
      <PropertyControlLabel
        htmlFor={`style-${property}`}
        label={stylePropertyLabel(property)}
        onReset={
          showModified
            ? () => {
                onNodeStyleEntry(property, null);
              }
            : undefined
        }
        showModified={showModified}
      />
      {stylePropertyValueEditor({
        currentValue,
        onNodeStyleEntry,
        property,
        utilityValues,
        valueEntry,
        visibleTokens,
      })}
    </div>
  );
}

async function fetchCollectionEntries(
  collectionSlug: string,
): Promise<PayloadCollectionDocRef[]> {
  const docs = await fetchPayloadCollectionDocs(collectionSlug);
  return docs.filter((doc) => doc.slug.length > 0);
}

function TextPrimitiveInspector({
  composition,
  node,
  content,
  fieldBound,
  exposeToEditors,
  onTextChange,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  content: string;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  onTextChange: (content: string) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const contentId = `${baseId}-content`;
  const exposeId = `${baseId}-expose`;
  const slotNameId = `${baseId}-slot-name`;
  const slotLabelId = `${baseId}-slot-label`;
  const slotDefaultId = `${baseId}-slot-default`;
  const slotTypeId = `${baseId}-slot-type`;

  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const committedName = fieldBound?.name;
  const committedLabel = fieldBound?.label;

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (committedName === undefined || committedLabel === undefined) {
      return;
    }
    setNameDraft(committedName);
    setLabelDraft(committedLabel);
    setFieldError(null);
  }, [committedLabel, committedName, exposeToEditors]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid editor field";
      setFieldError(msg);
      return;
    }
    setFieldError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <>
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={exposeToEditors}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={contentId}
          label="Content"
          onResetProp={resetNodePropKey}
          propKey="content"
          propValues={node.propValues}
        >
          <Input
            data-testid="inspector-text-content"
            id={contentId}
            onChange={(e) => onTextChange(e.target.value)}
            type="text"
            value={content}
          />
        </SettingsFieldRow>
      )}
      {collectionMapped ? null : (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={exposeToEditors}
            disabled={node.contentBinding?.source === "collection"}
            id={exposeId}
            onChange={(e) => {
              if (e.target.checked) {
                applyEditorField({
                  name: "content",
                  type: "text",
                  required: false,
                  label: "Content",
                  defaultValue: content,
                });
              } else {
                setFieldError(null);
                setNodeEditorFieldBinding(null);
              }
            }}
          />
          <Label className="text-sm font-normal" htmlFor={exposeId}>
            Expose to CMS editors
          </Label>
        </div>
      )}
      {collectionMapped ? null : exposeToEditors && fieldBound ? (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotNameId}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8"
              data-testid="inspector-slot-name"
              id={slotNameId}
              onBlur={() => {
                if (!fieldBound) {
                  return;
                }
                const trimmed = nameDraft.trim();
                applyEditorField({
                  ...fieldBound,
                  name: trimmed,
                });
              }}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setFieldError(null);
              }}
              placeholder="hero-title"
              spellCheck={false}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotLabelId}
            >
              Label
            </Label>
            <Input
              className="h-8"
              id={slotLabelId}
              onBlur={() => {
                if (!fieldBound) {
                  return;
                }
                const label = labelDraft.trim() || "Content";
                applyEditorField({
                  ...fieldBound,
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => {
                setLabelDraft(e.target.value);
                setFieldError(null);
              }}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotTypeId}
            >
              Editor field type
            </Label>
            <Select
              onValueChange={(value) => {
                const type = value as EditorFieldSpec["type"];
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  type,
                });
              }}
              value={fieldBound.type}
            >
              <SelectTrigger data-testid="inspector-slot-type" id={slotTypeId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITOR_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-req`}
              onChange={(e) => {
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  required: e.target.checked,
                });
              }}
            />
            <Label className="text-sm font-normal" htmlFor={`${baseId}-req`}>
              Required
            </Label>
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotDefaultId}
            >
              Default value
            </Label>
            <Input
              className="h-8"
              id={slotDefaultId}
              onChange={(e) => {
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  defaultValue: e.target.value,
                });
              }}
              type="text"
              value={
                typeof fieldBound.defaultValue === "string"
                  ? fieldBound.defaultValue
                  : ""
              }
            />
          </div>
          {fieldError ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

function HeadingPrimitiveInspector({
  composition,
  node,
  patchNodeProps,
  fieldBound,
  exposeToEditors,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const level =
    typeof node.propValues?.level === "string" &&
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.propValues.level)
      ? node.propValues.level
      : "h2";
  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const committedName = fieldBound?.name;
  const committedLabel = fieldBound?.label;

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (committedName === undefined || committedLabel === undefined) {
      return;
    }
    setNameDraft(committedName);
    setLabelDraft(committedLabel);
    setFieldError(null);
  }, [committedLabel, committedName, exposeToEditors]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid editor field";
      setFieldError(msg);
      return;
    }
    setFieldError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-5">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={exposeToEditors}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-heading-content`}
          label="Content"
          onResetProp={resetNodePropKey}
          propKey="content"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-heading-content`}
            onChange={(e) => patchNodeProps({ content: e.target.value })}
            type="text"
            value={content}
          />
        </SettingsFieldRow>
      )}
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-heading-level`}
        label="Heading level"
        onResetProp={resetNodePropKey}
        propKey="level"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) => patchNodeProps({ level: value })}
          value={level}
        >
          <SelectTrigger id={`${baseId}-heading-level`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1</SelectItem>
            <SelectItem value="h2">H2</SelectItem>
            <SelectItem value="h3">H3</SelectItem>
            <SelectItem value="h4">H4</SelectItem>
            <SelectItem value="h5">H5</SelectItem>
            <SelectItem value="h6">H6</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      {collectionMapped ? null : (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={exposeToEditors}
            disabled={node.contentBinding?.source === "collection"}
            id={`${baseId}-heading-expose`}
            onChange={(e) => {
              if (e.target.checked) {
                applyEditorField({
                  name: "heading",
                  type: "text",
                  required: false,
                  label: "Heading",
                  defaultValue: content,
                });
                return;
              }
              setFieldError(null);
              setNodeEditorFieldBinding(null);
            }}
          />
          <Label
            className="text-sm font-normal"
            htmlFor={`${baseId}-heading-expose`}
          >
            Expose to CMS editors
          </Label>
        </div>
      )}
      {collectionMapped ? null : exposeToEditors && fieldBound ? (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-name`}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8"
              id={`${baseId}-heading-slot-name`}
              onBlur={() => {
                const trimmed = nameDraft.trim();
                applyEditorField({
                  ...fieldBound,
                  name: trimmed,
                });
              }}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setFieldError(null);
              }}
              placeholder="hero-heading"
              spellCheck={false}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-label`}
            >
              Label
            </Label>
            <Input
              className="h-8"
              id={`${baseId}-heading-slot-label`}
              onBlur={() => {
                const label = labelDraft.trim() || "Heading";
                applyEditorField({
                  ...fieldBound,
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => {
                setLabelDraft(e.target.value);
                setFieldError(null);
              }}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-type`}
            >
              Editor field type
            </Label>
            <Select
              onValueChange={(value) => {
                const type = value as EditorFieldSpec["type"];
                applyEditorField({
                  ...fieldBound,
                  type,
                });
              }}
              value={fieldBound.type}
            >
              <SelectTrigger
                data-testid="inspector-heading-slot-type"
                id={`${baseId}-heading-slot-type`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITOR_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-heading-req`}
              onChange={(e) => {
                applyEditorField({
                  ...fieldBound,
                  required: e.target.checked,
                });
              }}
            />
            <Label
              className="text-sm font-normal"
              htmlFor={`${baseId}-heading-req`}
            >
              Required
            </Label>
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-default`}
            >
              Default value
            </Label>
            <Input
              className="h-8"
              id={`${baseId}-heading-slot-default`}
              onChange={(e) => {
                applyEditorField({
                  ...fieldBound,
                  defaultValue: e.target.value,
                });
              }}
              type="text"
              value={
                typeof fieldBound.defaultValue === "string"
                  ? fieldBound.defaultValue
                  : ""
              }
            />
          </div>
          {fieldError ? (
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ButtonPrimitivePayloadCollectionFields({
  baseId,
  collectionSlug,
  definitionKey,
  entries,
  entryLoadError,
  entryLoading,
  entryPickerOpen,
  entrySlug,
  nodePropValues,
  patchNodeProps,
  resetNodePropKey,
  setEntryPickerOpen,
}: {
  baseId: string;
  collectionSlug: string;
  definitionKey: string;
  entries: PayloadCollectionDocRef[];
  entryLoadError: string | null;
  entryLoading: boolean;
  entryPickerOpen: boolean;
  entrySlug: string;
  nodePropValues: CompositionNode["propValues"];
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setEntryPickerOpen: (open: boolean) => void;
}) {
  return (
    <>
      <SettingsFieldRow
        definitionKey={definitionKey}
        htmlFor={`${baseId}-button-collection`}
        label="Collection slug"
        onResetProp={resetNodePropKey}
        propKey="collectionSlug"
        propValues={nodePropValues}
      >
        <Input
          id={`${baseId}-button-collection`}
          onChange={(e) =>
            patchNodeProps({
              collectionSlug: e.target.value,
            })
          }
          placeholder="pages"
          type="text"
          value={collectionSlug}
        />
      </SettingsFieldRow>
      <SettingsFieldRow
        definitionKey={definitionKey}
        htmlFor={`${baseId}-button-entry`}
        label="Entry slug (optional)"
        onResetProp={resetNodePropKey}
        propKey="entrySlug"
        propValues={nodePropValues}
      >
        <div className="flex items-center gap-2">
          <Input
            id={`${baseId}-button-entry`}
            onChange={(e) =>
              patchNodeProps({
                entrySlug: e.target.value,
              })
            }
            placeholder="about"
            type="text"
            value={entrySlug}
          />
          <Sheet onOpenChange={setEntryPickerOpen} open={entryPickerOpen}>
            <SheetTrigger asChild>
              <Button
                disabled={!collectionSlug.trim()}
                size="sm"
                type="button"
                variant="ghost"
              >
                Browse
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  Select {collectionSlug || "collection"} entry
                </SheetTitle>
                <SheetDescription>
                  Pick an entry and we will set its slug.
                </SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <div className="space-y-2 py-1 pr-2">
                  {entryLoading ? (
                    <p className="text-sm text-muted-foreground">Loading…</p>
                  ) : entryLoadError ? (
                    <p className="text-sm text-red-500">{entryLoadError}</p>
                  ) : entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No entries found.
                    </p>
                  ) : (
                    entries.map((entry) => (
                      <button
                        className="w-full rounded-md border border-border/60 p-2 text-left hover:bg-accent/50"
                        key={`${entry.id}-${entry.slug}`}
                        onClick={() => {
                          patchNodeProps({
                            collectionSlug: collectionSlug.trim(),
                            entrySlug: entry.slug,
                          });
                          setEntryPickerOpen(false);
                        }}
                        type="button"
                      >
                        <div className="text-sm font-medium">{entry.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {entry.slug}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
              <div className="pt-3">
                <SheetClose asChild>
                  <Button size="sm" type="button" variant="ghost">
                    Close
                  </Button>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </SettingsFieldRow>
    </>
  );
}

function ButtonPrimitiveInspector({
  composition,
  node,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
}) {
  const baseId = useId();
  const label =
    typeof node.propValues?.label === "string" ? node.propValues.label : "";
  const linkType =
    node.propValues?.linkType === "payloadCollection"
      ? "payloadCollection"
      : "url";
  const href =
    typeof node.propValues?.href === "string" ? node.propValues.href : "";
  const collectionSlug =
    typeof node.propValues?.collectionSlug === "string"
      ? node.propValues.collectionSlug
      : "";
  const entrySlug =
    typeof node.propValues?.entrySlug === "string"
      ? node.propValues.entrySlug
      : "";
  const openInNewTab = Boolean(node.propValues?.openInNewTab);
  const [entryPickerOpen, setEntryPickerOpen] = useState(false);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryLoadError, setEntryLoadError] = useState<string | null>(null);
  const [entries, setEntries] = useState<PayloadCollectionDocRef[]>([]);

  useEffect(() => {
    if (!entryPickerOpen || !collectionSlug.trim()) {
      return;
    }
    setEntryLoading(true);
    setEntryLoadError(null);
    void fetchCollectionEntries(collectionSlug)
      .then((docs) => {
        setEntries(docs);
      })
      .catch((err) => {
        setEntryLoadError(
          err instanceof Error ? err.message : "Failed to load entries",
        );
      })
      .finally(() => {
        setEntryLoading(false);
      });
  }, [collectionSlug, entryPickerOpen]);

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-4">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={false}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-button-label`}
          label="Label"
          onResetProp={resetNodePropKey}
          propKey="label"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-button-label`}
            onChange={(e) => patchNodeProps({ label: e.target.value })}
            type="text"
            value={label}
          />
        </SettingsFieldRow>
      )}
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-button-link-type`}
        label="Link source"
        onResetProp={resetNodePropKey}
        propKey="linkType"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) =>
            patchNodeProps({
              linkType: value,
            })
          }
          value={linkType}
        >
          <SelectTrigger id={`${baseId}-button-link-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="payloadCollection">
              Payload collection
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      {linkType === "url" ? (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-button-url`}
          label="URL"
          onResetProp={resetNodePropKey}
          propKey="href"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-button-url`}
            onChange={(e) => patchNodeProps({ href: e.target.value })}
            placeholder="https://"
            type="url"
            value={href}
          />
        </SettingsFieldRow>
      ) : (
        <ButtonPrimitivePayloadCollectionFields
          baseId={baseId}
          collectionSlug={collectionSlug}
          definitionKey={node.definitionKey}
          entries={entries}
          entryLoadError={entryLoadError}
          entryLoading={entryLoading}
          entryPickerOpen={entryPickerOpen}
          entrySlug={entrySlug}
          nodePropValues={node.propValues}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setEntryPickerOpen={setEntryPickerOpen}
        />
      )}
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-button-new-tab`}
        checked={openInNewTab}
        definitionKey={node.definitionKey}
        label="Open in new tab"
        onCheckedChange={(next) => patchNodeProps({ openInNewTab: next })}
        onResetProp={resetNodePropKey}
        propKey="openInNewTab"
        propValues={node.propValues}
      />
    </div>
  );
}

function ImagePrimitiveInspectorAltAndBindingFields({
  applyEditorField,
  baseId,
  error,
  exposeToEditors,
  fieldBound,
  labelDraft,
  mediaId,
  nameDraft,
  node,
  patchNodeProps,
  resetNodePropKey,
  setLabelDraft,
  setNameDraft,
  setNodeEditorFieldBinding,
  alt,
}: {
  alt: string;
  applyEditorField: (next: EditorFieldSpec) => void;
  baseId: string;
  error: string | null;
  exposeToEditors: boolean;
  fieldBound: EditorFieldSpec | undefined;
  labelDraft: string;
  mediaId: number | "";
  nameDraft: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setLabelDraft: (value: string) => void;
  setNameDraft: (value: string) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  return (
    <>
      <div className="border-t border-border/60 pt-5">
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-image-alt`}
          label="Alt text"
          onResetProp={resetNodePropKey}
          propKey="alt"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-image-alt`}
            onChange={(e) => patchNodeProps({ alt: e.target.value })}
            type="text"
            value={alt}
          />
        </SettingsFieldRow>
      </div>
      <div className="flex items-center gap-2.5 border-t border-border/60 pt-5">
        <Checkbox
          checked={exposeToEditors}
          disabled={node.contentBinding?.source === "collection"}
          id={`${baseId}-image-expose`}
          onChange={(e) => {
            if (e.target.checked) {
              applyEditorField({
                name: "image",
                type: "image",
                required: false,
                label: "Image",
                defaultValue: mediaId === "" ? "" : mediaId,
              });
              return;
            }
            setNodeEditorFieldBinding(null);
          }}
        />
        <Label
          className="text-sm font-normal"
          htmlFor={`${baseId}-image-expose`}
        >
          Expose to CMS editors
        </Label>
      </div>
      {exposeToEditors && fieldBound ? (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="space-y-3">
            <Label htmlFor={`${baseId}-image-slot-name`}>
              Field name (kebab-case)
            </Label>
            <Input
              id={`${baseId}-image-slot-name`}
              onBlur={() => {
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  name: nameDraft.trim(),
                });
              }}
              onChange={(e) => setNameDraft(e.target.value)}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor={`${baseId}-image-slot-label`}>Label</Label>
            <Input
              id={`${baseId}-image-slot-label`}
              onBlur={() => {
                const label = labelDraft.trim() || "Image";
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => setLabelDraft(e.target.value)}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-image-required`}
              onChange={(e) => {
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  required: e.target.checked,
                });
              }}
            />
            <Label
              className="text-sm font-normal"
              htmlFor={`${baseId}-image-required`}
            >
              Required
            </Label>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

function ImagePrimitiveInspector({
  composition,
  node,
  fieldBound,
  exposeToEditors,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const alt =
    typeof node.propValues?.alt === "string" ? node.propValues.alt : "";
  const mediaId = parseMediaIdFromPropValues(node.propValues, "mediaId");
  const [error, setError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const committedName = fieldBound?.name;
  const committedLabel = fieldBound?.label;

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      return;
    }
    if (committedName === undefined || committedLabel === undefined) {
      return;
    }
    setNameDraft(committedName);
    setLabelDraft(committedLabel);
  }, [committedLabel, committedName, exposeToEditors]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid editor field");
      return;
    }
    setError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-6">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={exposeToEditors}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <>
          <ImageSourcePayloadInspectorFields
            altForUpload={alt}
            altValueKey="alt"
            baseId={baseId}
            definitionKey={node.definitionKey}
            keys={IMAGE_PRIMITIVE_MEDIA_KEYS}
            node={node}
            patchNodeProps={patchNodeProps}
            resetNodePropKey={resetNodePropKey}
            setError={setError}
            urlFieldLabel="Image URL"
          />
          <ImagePrimitiveInspectorAltAndBindingFields
            alt={alt}
            applyEditorField={applyEditorField}
            baseId={baseId}
            error={error}
            exposeToEditors={exposeToEditors}
            fieldBound={fieldBound}
            labelDraft={labelDraft}
            mediaId={mediaId}
            nameDraft={nameDraft}
            node={node}
            patchNodeProps={patchNodeProps}
            resetNodePropKey={resetNodePropKey}
            setLabelDraft={setLabelDraft}
            setNameDraft={setNameDraft}
            setNodeEditorFieldBinding={setNodeEditorFieldBinding}
          />
        </>
      )}
    </div>
  );
}

function VideoPrimitiveInspectorUrlFields({
  baseId,
  node,
  patchNodeProps,
  resetNodePropKey,
  src,
}: {
  baseId: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  src: string;
}) {
  return (
    <div className="min-w-0 space-y-3 border-t border-border/60 pt-5">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-url`}
        label="Video URL"
        onResetProp={resetNodePropKey}
        propKey="src"
        propValues={node.propValues}
      >
        <Input
          id={`${baseId}-video-url`}
          onChange={(e) =>
            patchNodeProps({
              src: e.target.value,
              videoSource: "url",
            })
          }
          placeholder="https://"
          type="url"
          value={src}
        />
      </SettingsFieldRow>
    </div>
  );
}

function VideoPrimitivePlaybackFields({
  baseId,
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  baseId: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const poster =
    typeof node.propValues?.poster === "string" ? node.propValues.poster : "";
  const objectFitRaw = node.propValues?.objectFit;
  const objectFit =
    typeof objectFitRaw === "string" && objectFitRaw.length > 0
      ? objectFitRaw
      : "cover";
  const preloadRaw = node.propValues?.preload;
  const preload =
    typeof preloadRaw === "string" && preloadRaw.length > 0
      ? preloadRaw
      : "metadata";
  const autoPlay = Boolean(node.propValues?.autoPlay);
  const loop = Boolean(node.propValues?.loop);
  const muted = Boolean(node.propValues?.muted);
  const playsInline = node.propValues?.playsInline !== false;
  const controls = node.propValues?.controls !== false;

  return (
    <div className="min-w-0 space-y-5 border-t border-border/60 pt-5">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-poster`}
        label="Poster image URL"
        onResetProp={resetNodePropKey}
        propKey="poster"
        propValues={node.propValues}
      >
        <Input
          id={`${baseId}-video-poster`}
          onChange={(e) => patchNodeProps({ poster: e.target.value })}
          placeholder="https://"
          type="url"
          value={poster}
        />
      </SettingsFieldRow>
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-object-fit`}
        label="Object fit"
        onResetProp={resetNodePropKey}
        propKey="objectFit"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) => patchNodeProps({ objectFit: value })}
          value={objectFit}
        >
          <SelectTrigger id={`${baseId}-video-object-fit`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-preload`}
        label="Preload"
        onResetProp={resetNodePropKey}
        propKey="preload"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) => patchNodeProps({ preload: value })}
          value={preload}
        >
          <SelectTrigger id={`${baseId}-video-preload`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="metadata">Metadata</SelectItem>
            <SelectItem value="auto">Auto</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-autoplay`}
        checked={autoPlay}
        definitionKey={node.definitionKey}
        label="Autoplay"
        onCheckedChange={(next) => patchNodeProps({ autoPlay: next })}
        onResetProp={resetNodePropKey}
        propKey="autoPlay"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-loop`}
        checked={loop}
        definitionKey={node.definitionKey}
        label="Loop"
        onCheckedChange={(next) => patchNodeProps({ loop: next })}
        onResetProp={resetNodePropKey}
        propKey="loop"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-muted`}
        checked={muted}
        definitionKey={node.definitionKey}
        label="Muted"
        onCheckedChange={(next) => patchNodeProps({ muted: next })}
        onResetProp={resetNodePropKey}
        propKey="muted"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-playsinline`}
        checked={playsInline}
        definitionKey={node.definitionKey}
        label="Plays inline"
        onCheckedChange={(next) => patchNodeProps({ playsInline: next })}
        onResetProp={resetNodePropKey}
        propKey="playsInline"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-controls`}
        checked={controls}
        definitionKey={node.definitionKey}
        label="Show controls"
        onCheckedChange={(next) => patchNodeProps({ controls: next })}
        onResetProp={resetNodePropKey}
        propKey="controls"
        propValues={node.propValues}
      />
    </div>
  );
}

function VideoPrimitiveInspector({
  composition,
  node,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
}) {
  const baseId = useId();
  const videoSource = node.propValues?.videoSource === "url" ? "url" : "media";
  const src =
    typeof node.propValues?.src === "string" ? node.propValues.src : "";
  const mediaId =
    typeof node.propValues?.mediaId === "number"
      ? node.propValues.mediaId
      : typeof node.propValues?.mediaId === "string" &&
          /^\d+$/.test(node.propValues.mediaId)
        ? Number.parseInt(node.propValues.mediaId, 10)
        : "";
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [mediaDocs, setMediaDocs] = useState<MediaListItem[]>([]);

  useEffect(() => {
    if (!mediaPickerOpen) {
      return;
    }
    setMediaLoading(true);
    setMediaLoadError(null);
    void fetchMediaRecords()
      .then((docs) => {
        setMediaDocs(docs);
      })
      .catch((err) => {
        setMediaLoadError(
          err instanceof Error ? err.message : "Failed to load media entries",
        );
      })
      .finally(() => {
        setMediaLoading(false);
      });
  }, [mediaPickerOpen]);

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="min-w-0 space-y-6">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={false}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <>
          <SettingsFieldRow
            definitionKey={node.definitionKey}
            htmlFor={`${baseId}-video-source`}
            label="Source"
            onResetProp={resetNodePropKey}
            propKey="videoSource"
            propValues={node.propValues}
          >
            <Select
              onValueChange={(value) =>
                patchNodeProps({
                  videoSource: value,
                })
              }
              value={videoSource}
            >
              <SelectTrigger id={`${baseId}-video-source`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="media">Payload Media</SelectItem>
              </SelectContent>
            </Select>
          </SettingsFieldRow>
          {videoSource === "url" ? (
            <VideoPrimitiveInspectorUrlFields
              baseId={baseId}
              node={node}
              patchNodeProps={patchNodeProps}
              resetNodePropKey={resetNodePropKey}
              src={src}
            />
          ) : (
            <PayloadMediaPickerFields
              altForUpload=""
              baseId={baseId}
              busy={busy}
              mediaDocs={mediaDocs}
              mediaId={mediaId}
              mediaLoadError={mediaLoadError}
              mediaLoading={mediaLoading}
              mediaPickerOpen={mediaPickerOpen}
              onSelectMediaDoc={(media) =>
                patchNodeProps({
                  videoSource: "media",
                  mediaId: media.id,
                  src: media.url,
                  mediaUrl: media.url,
                })
              }
              onUploadComplete={(media) =>
                patchNodeProps({
                  videoSource: "media",
                  mediaId: media.id,
                  src: media.url,
                  mediaUrl: media.url,
                })
              }
              setBusy={setBusy}
              setError={setError}
              setMediaPickerOpen={setMediaPickerOpen}
              src={src}
              uploadInputRef={uploadInputRef}
              variant="video"
            />
          )}
        </>
      )}
      <VideoPrimitivePlaybackFields
        baseId={baseId}
        node={node}
        patchNodeProps={patchNodeProps}
        resetNodePropKey={resetNodePropKey}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function InspectorStyleValueGrid({
  composition,
  node,
  onNodeStyleEntry,
  properties,
  tokenMetadata,
}: {
  composition: PageComposition;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  properties: readonly StyleProperty[];
  tokenMetadata: TokenMeta[];
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {properties.map((property) => {
        const styleEntry = readStyleProperty(composition, node, property);
        return (
          <StyleValueSelect
            key={property}
            onNodeStyleEntry={onNodeStyleEntry}
            property={property}
            tokenMetadata={tokenMetadata}
            valueEntry={styleEntry}
          />
        );
      })}
    </div>
  );
}

function InspectorStyleMoreOptionsBlock({
  composition,
  groupedSecondaryProperties,
  moreOptionsLabel,
  node,
  onNodeStyleEntry,
  sectionId,
  tokenMetadata,
}: {
  composition: PageComposition;
  groupedSecondaryProperties: StyleProperty[];
  moreOptionsLabel: string;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  sectionId: StyleSectionId;
  tokenMetadata: TokenMeta[];
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          className="h-8 w-full justify-between px-2 text-xs"
          type="button"
          variant="ghost"
        >
          <span>{moreOptionsLabel}</span>
          <span className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {groupedSecondaryProperties.length}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className={moreOptionsGridClassName(sectionId)}>
          {groupedSecondaryProperties.map((property) => {
            const styleEntry = readStyleProperty(composition, node, property);
            return (
              <StyleValueSelect
                key={property}
                onNodeStyleEntry={onNodeStyleEntry}
                property={property}
                tokenMetadata={tokenMetadata}
                valueEntry={styleEntry}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InspectorSpacingStyleSection({
  composition,
  isStyleSectionOpen,
  model,
  node,
  onNodeStyleEntry,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  composition: PageComposition;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  model: NonNullable<ReturnType<typeof inspectorStyleSectionModelFromSection>>;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  const showMoreOptions =
    model.secondaryProperties.length > 0 && model.primaryProperties.length > 0;
  return (
    <div className={`${inspectorStyleSectionTopClass(sectionIndex)}space-y-4`}>
      <Collapsible
        onOpenChange={(open) => setStyleSectionOpen(section.id, open)}
        open={isStyleSectionOpen(section.id)}
      >
        <CollapsibleTrigger asChild>
          <Button
            className="group w-full justify-between px-1"
            size="panel"
            type="button"
            variant="panel"
          >
            <span className="flex items-center gap-1.5">
              <section.Icon
                aria-hidden
                className="size-3.5 text-muted-foreground/90"
                stroke={1.7}
              />
              <span>Margin & Padding</span>
            </span>
            <IconChevronDown
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              stroke={1.8}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <SpacingBoxControl
            availableProperties={new Set(model.sectionProperties)}
            composition={composition}
            node={node}
            onNodeStyleEntry={onNodeStyleEntry}
          />
          {model.visibleProperties.length > 0 ? (
            <InspectorStyleValueGrid
              composition={composition}
              node={node}
              onNodeStyleEntry={onNodeStyleEntry}
              properties={model.visibleProperties}
              tokenMetadata={tokenMetadata}
            />
          ) : null}
          {showMoreOptions ? (
            <InspectorStyleMoreOptionsBlock
              composition={composition}
              groupedSecondaryProperties={model.groupedSecondaryProperties}
              moreOptionsLabel="More spacing options"
              node={node}
              onNodeStyleEntry={onNodeStyleEntry}
              sectionId={section.id}
              tokenMetadata={tokenMetadata}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function InspectorBorderStyleSection({
  composition,
  isStyleSectionOpen,
  model,
  node,
  onNodeStyleEntry,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  composition: PageComposition;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  model: NonNullable<ReturnType<typeof inspectorStyleSectionModelFromSection>>;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  return (
    <div className={`${inspectorStyleSectionTopClass(sectionIndex)}space-y-4`}>
      <Collapsible
        onOpenChange={(open) => setStyleSectionOpen(section.id, open)}
        open={isStyleSectionOpen(section.id)}
      >
        <CollapsibleTrigger asChild>
          <Button
            className="group w-full justify-between px-1"
            size="panel"
            type="button"
            variant="panel"
          >
            <span className="flex items-center gap-1.5">
              <section.Icon
                aria-hidden
                className="size-3.5 text-muted-foreground/90"
                stroke={1.7}
              />
              <span>{section.label}</span>
            </span>
            <IconChevronDown
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              stroke={1.8}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <BorderControl
            availableProperties={new Set(model.filteredSectionProperties)}
            composition={composition}
            node={node}
            onNodeStyleEntry={onNodeStyleEntry}
            tokenMetadata={tokenMetadata}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function InspectorDefaultStyleSection({
  composition,
  isStyleSectionOpen,
  model,
  node,
  onNodeStyleEntry,
  patchNodeProps,
  resetNodePropKey,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  composition: PageComposition;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  model: NonNullable<ReturnType<typeof inspectorStyleSectionModelFromSection>>;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  patchNodeProps?: (patch: Record<string, unknown>) => void;
  resetNodePropKey?: (propKey: string) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  const showMoreOptions =
    model.secondaryProperties.length > 0 && model.primaryProperties.length > 0;
  return (
    <div className={`${inspectorStyleSectionTopClass(sectionIndex)}space-y-4`}>
      <Collapsible
        onOpenChange={(open) => setStyleSectionOpen(section.id, open)}
        open={isStyleSectionOpen(section.id)}
      >
        <CollapsibleTrigger asChild>
          <Button
            className="group w-full justify-between px-1"
            size="panel"
            type="button"
            variant="panel"
          >
            <span className="flex items-center gap-1.5">
              <section.Icon
                aria-hidden
                className="size-3.5 text-muted-foreground/90"
                stroke={1.7}
              />
              <span>{section.label}</span>
            </span>
            <IconChevronDown
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              stroke={1.8}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <InspectorStyleValueGrid
            composition={composition}
            node={node}
            onNodeStyleEntry={onNodeStyleEntry}
            properties={model.visibleProperties}
            tokenMetadata={tokenMetadata}
          />
          {showMoreOptions ? (
            <InspectorStyleMoreOptionsBlock
              composition={composition}
              groupedSecondaryProperties={model.groupedSecondaryProperties}
              moreOptionsLabel={`More ${section.label.toLowerCase()} options`}
              node={node}
              onNodeStyleEntry={onNodeStyleEntry}
              sectionId={section.id}
              tokenMetadata={tokenMetadata}
            />
          ) : null}
          {section.id === "color" &&
          node.definitionKey === "primitive.box" &&
          patchNodeProps &&
          resetNodePropKey ? (
            <BoxPrimitiveBackgroundImageSection
              node={node}
              patchNodeProps={patchNodeProps}
              resetNodePropKey={resetNodePropKey}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function InspectorOrderedStyleSectionItem({
  composition,
  gapPropertyAvailable,
  isStyleSectionOpen,
  node,
  onNodeStyleEntry,
  patchNodeProps,
  resetNodePropKey,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  composition: PageComposition;
  gapPropertyAvailable: boolean;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  patchNodeProps?: (patch: Record<string, unknown>) => void;
  resetNodePropKey?: (propKey: string) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  const model = inspectorStyleSectionModelFromSection(
    section,
    gapPropertyAvailable,
  );
  if (!model) {
    return null;
  }
  if (section.id === "spacing") {
    return (
      <InspectorSpacingStyleSection
        composition={composition}
        isStyleSectionOpen={isStyleSectionOpen}
        model={model}
        node={node}
        onNodeStyleEntry={onNodeStyleEntry}
        section={section}
        sectionIndex={sectionIndex}
        setStyleSectionOpen={setStyleSectionOpen}
        tokenMetadata={tokenMetadata}
      />
    );
  }
  if (section.id === "border") {
    return (
      <InspectorBorderStyleSection
        composition={composition}
        isStyleSectionOpen={isStyleSectionOpen}
        model={model}
        node={node}
        onNodeStyleEntry={onNodeStyleEntry}
        section={section}
        sectionIndex={sectionIndex}
        setStyleSectionOpen={setStyleSectionOpen}
        tokenMetadata={tokenMetadata}
      />
    );
  }
  return (
    <InspectorDefaultStyleSection
      composition={composition}
      isStyleSectionOpen={isStyleSectionOpen}
      model={model}
      node={node}
      onNodeStyleEntry={onNodeStyleEntry}
      patchNodeProps={patchNodeProps}
      resetNodePropKey={resetNodePropKey}
      section={section}
      sectionIndex={sectionIndex}
      setStyleSectionOpen={setStyleSectionOpen}
      tokenMetadata={tokenMetadata}
    />
  );
}

function PropertyInspectorSettingsTab({
  componentsHref,
  composition,
  content,
  exposeToEditors,
  fieldBound,
  isButton,
  isHeading,
  isImage,
  isVideo,
  isLibraryComponent,
  isSlot,
  isText,
  node,
  onTextChange,
  pageTemplateStudio,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  componentsHref: string;
  composition: PageComposition;
  content: string;
  exposeToEditors: boolean;
  fieldBound: EditorFieldSpec | undefined;
  isButton: boolean;
  isHeading: boolean;
  isImage: boolean;
  isVideo: boolean;
  isLibraryComponent: boolean;
  isSlot: boolean;
  isText: boolean;
  node: CompositionNode;
  onTextChange: (content: string) => void;
  pageTemplateStudio: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  return (
    <>
      {isText ? (
        <TextPrimitiveInspector
          composition={composition}
          content={content}
          exposeToEditors={exposeToEditors}
          fieldBound={fieldBound}
          node={node}
          onTextChange={onTextChange}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        />
      ) : null}
      {isHeading ? (
        <HeadingPrimitiveInspector
          composition={composition}
          exposeToEditors={exposeToEditors}
          fieldBound={fieldBound}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        />
      ) : null}
      {isButton ? (
        <ButtonPrimitiveInspector
          composition={composition}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
        />
      ) : null}
      {isImage ? (
        <ImagePrimitiveInspector
          composition={composition}
          exposeToEditors={exposeToEditors}
          fieldBound={fieldBound}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        />
      ) : null}
      {isVideo ? (
        <VideoPrimitiveInspector
          composition={composition}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
        />
      ) : null}
      {isSlot ? (
        <div className="border-t border-border/60 pt-4">
          <SettingsFieldRow
            definitionKey={node.definitionKey}
            htmlFor="inspector-slot-id"
            label="Slot id"
            onResetProp={resetNodePropKey}
            propKey="slotId"
            propValues={node.propValues}
          >
            <Input
              data-testid="inspector-slot-id"
              id="inspector-slot-id"
              onChange={(e) => patchNodeProps({ slotId: e.target.value })}
              placeholder="main"
              type="text"
              value={
                typeof node.propValues?.slotId === "string"
                  ? node.propValues.slotId
                  : ""
              }
            />
          </SettingsFieldRow>
        </div>
      ) : null}
      {isLibraryComponent ? (
        <div className="space-y-2 border-t border-border/60 pt-4">
          {pageTemplateStudio ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              This block uses a published library component. Edit its layout and
              fields in Component studio — open it from{" "}
              <a
                className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
                href={componentsHref}
              >
                Components
              </a>{" "}
              in the CMS.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Open the referenced component in Component studio to edit its
              definition.
            </p>
          )}
        </div>
      ) : null}
      {node.definitionKey === "primitive.box" ? (
        <BoxPrimitiveInspector
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
        />
      ) : null}
      {node.definitionKey === "primitive.collection" ? (
        <CollectionPrimitiveInspector
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
        />
      ) : null}
    </>
  );
}

function PropertyInspectorActive({
  clearNodeStyles,
  componentsHref,
  composition,
  inspectorTab,
  node,
  onInspectorTabChange,
  onNodeStyleEntry,
  onTextChange,
  pageTemplateStudio,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
  setStyleSectionOpenState,
  styleSectionOpenState,
  tokenMetadata,
}: {
  clearNodeStyles: () => void;
  componentsHref: string;
  composition: PageComposition;
  inspectorTab: StudioInspectorTab;
  node: CompositionNode;
  onInspectorTabChange: (tab: StudioInspectorTab) => void;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  onTextChange: (content: string) => void;
  pageTemplateStudio: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
  setStyleSectionOpenState: Dispatch<
    SetStateAction<Partial<Record<StyleSectionId, boolean>>>
  >;
  styleSectionOpenState: Partial<Record<StyleSectionId, boolean>>;
  tokenMetadata: TokenMeta[];
}) {
  const isText = node.definitionKey === "primitive.text";
  const isHeading = node.definitionKey === "primitive.heading";
  const isButton = node.definitionKey === "primitive.button";
  const isImage = node.definitionKey === "primitive.image";
  const isVideo = node.definitionKey === "primitive.video";
  const isSlot = node.definitionKey === "primitive.slot";
  const isLibraryComponent =
    node.definitionKey === "primitive.libraryComponent";

  const libraryLabels = useLibraryComponentLabels();
  const componentKey =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey
      : "";

  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const fieldBound =
    node.contentBinding?.source === "editor"
      ? node.contentBinding.editorField
      : undefined;
  const semanticShellTag = semanticShellTagForNode(node);
  const nodeLabel = useMemo(() => {
    if (isLibraryComponent) {
      return libraryDisplayNameForKey(libraryLabels, componentKey);
    }
    if (semanticShellTag) {
      return `${semanticShellTag.charAt(0).toUpperCase()}${semanticShellTag.slice(1)}`;
    }
    if (
      node.definitionKey === "primitive.box" &&
      node.propValues?.tag === "section"
    ) {
      return "Section";
    }
    return getPrimitiveDisplay(node.definitionKey).label;
  }, [
    componentKey,
    isLibraryComponent,
    libraryLabels,
    node.definitionKey,
    node.propValues?.tag,
    semanticShellTag,
  ]);
  const exposeToEditors = Boolean(fieldBound);
  const stylePropertiesBySection = stylePropertiesBySectionForDefinitionKey(
    node.definitionKey,
  );
  const orderedStyleSections = orderedStyleSectionsForInspector(
    stylePropertiesBySection,
  );
  const hasStyleControls = stylePropertiesBySection.length > 0;
  const hasStyleOverrides = nodeHasNonEmptyStyleBinding(composition, node);
  const gapPropertyAvailable = stylePropertiesBySection.some((section) =>
    section.properties.includes("gap"),
  );
  const isStyleSectionOpen = (sectionId: StyleSectionId) =>
    styleSectionOpenState[sectionId] ?? false;
  const setStyleSectionOpen = (sectionId: StyleSectionId, open: boolean) => {
    setStyleSectionOpenState((prev) => {
      if ((prev[sectionId] ?? false) === open) {
        return prev;
      }
      return { ...prev, [sectionId]: open };
    });
  };
  const styleSectionIdsWithControls = collectStyleSectionIdsWithControls(
    orderedStyleSections,
    gapPropertyAvailable,
  );
  const allStyleSectionsCollapsed =
    styleSectionIdsWithControls.length > 0 &&
    styleSectionIdsWithControls.every(
      (sectionId) => !isStyleSectionOpen(sectionId),
    );
  const showStyleToolbarActions =
    inspectorTab === "styles" &&
    hasStyleControls &&
    (styleSectionIdsWithControls.length > 0 || hasStyleOverrides);

  return (
    <TooltipProvider>
      <div className="min-w-0 space-y-4 text-sm">
        <Tabs
          className="min-h-0 w-full min-w-0"
          onValueChange={(value) => {
            if (value === "styles" || value === "settings") {
              onInspectorTabChange(value);
            }
          }}
          value={inspectorTab}
        >
          <div
            className={cn(
              "text-base font-semibold text-foreground",
              isLibraryComponent
                ? "normal-case tracking-tight"
                : "uppercase tracking-[0.1em]",
            )}
          >
            {nodeLabel}
          </div>
          <div className="mt-3 space-y-2">
            <TabsList className="grid w-fit shrink-0 grid-cols-2">
              <TabsTrigger
                aria-keyshortcuts="4"
                title="Styles (4)"
                value="styles"
              >
                Styles
              </TabsTrigger>
              <TabsTrigger
                aria-keyshortcuts="5"
                title="Settings (5)"
                value="settings"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            {showStyleToolbarActions ? (
              <div className="flex items-center gap-2">
                {hasStyleOverrides ? (
                  <Button
                    className="shrink-0"
                    onClick={clearNodeStyles}
                    size="panel"
                    type="button"
                    variant="compact"
                  >
                    Reset styles
                  </Button>
                ) : null}
                {styleSectionIdsWithControls.length > 0 ? (
                  <StudioBulkCollapseButton
                    allCollapsed={allStyleSectionsCollapsed}
                    className="ml-auto"
                    onClick={() => {
                      const nextOpen = allStyleSectionsCollapsed;
                      setStyleSectionOpenState((prev) => {
                        const next = { ...prev };
                        for (const sectionId of styleSectionIdsWithControls) {
                          next[sectionId] = nextOpen;
                        }
                        return next;
                      });
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
          <TabsContent className="mt-4 min-w-0" value="styles">
            {hasStyleControls ? (
              <div className="space-y-4">
                {orderedStyleSections.map((section, sectionIndex) => (
                  <InspectorOrderedStyleSectionItem
                    key={section.id}
                    composition={composition}
                    gapPropertyAvailable={gapPropertyAvailable}
                    isStyleSectionOpen={isStyleSectionOpen}
                    node={node}
                    onNodeStyleEntry={onNodeStyleEntry}
                    patchNodeProps={patchNodeProps}
                    resetNodePropKey={resetNodePropKey}
                    section={section}
                    sectionIndex={sectionIndex}
                    setStyleSectionOpen={setStyleSectionOpen}
                    tokenMetadata={tokenMetadata}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-xs leading-snug text-muted-foreground">
                No style controls available for this element.
              </div>
            )}
          </TabsContent>
          <TabsContent className="mt-4 min-w-0 space-y-4" value="settings">
            <PropertyInspectorSettingsTab
              componentsHref={componentsHref}
              composition={composition}
              content={content}
              exposeToEditors={exposeToEditors}
              fieldBound={fieldBound}
              isButton={isButton}
              isHeading={isHeading}
              isImage={isImage}
              isVideo={isVideo}
              isLibraryComponent={isLibraryComponent}
              isSlot={isSlot}
              isText={isText}
              node={node}
              onTextChange={onTextChange}
              pageTemplateStudio={pageTemplateStudio}
              patchNodeProps={patchNodeProps}
              resetNodePropKey={resetNodePropKey}
              setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
              setNodeEditorFieldBinding={setNodeEditorFieldBinding}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

export function PropertyInspector({
  clearNodeStyles,
  componentsHref = "",
  composition,
  inspectorTab,
  node,
  onInspectorTabChange,
  onNodeStyleEntry,
  onTextChange,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
  studioResource,
  tokenMetadata,
}: {
  clearNodeStyles: () => void;
  componentsHref?: string;
  composition: PageComposition | null;
  inspectorTab: StudioInspectorTab;
  node: CompositionNode | null;
  onInspectorTabChange: (tab: StudioInspectorTab) => void;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  onTextChange: (content: string) => void;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
  studioResource?: "pageTemplate" | "component" | null;
  tokenMetadata: TokenMeta[];
}) {
  const [styleSectionOpenState, setStyleSectionOpenState] = useState<
    Partial<Record<StyleSectionId, boolean>>
  >({});

  if (!node || !composition) {
    return (
      <div className="text-sm text-muted-foreground">
        Select an element on the canvas or in layers.
      </div>
    );
  }

  const pageTemplateStudio = studioResource === "pageTemplate";

  return (
    <PropertyInspectorActive
      clearNodeStyles={clearNodeStyles}
      componentsHref={componentsHref}
      composition={composition}
      inspectorTab={inspectorTab}
      node={node}
      onInspectorTabChange={onInspectorTabChange}
      onNodeStyleEntry={onNodeStyleEntry}
      onTextChange={onTextChange}
      pageTemplateStudio={pageTemplateStudio}
      patchNodeProps={patchNodeProps}
      resetNodePropKey={resetNodePropKey}
      setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      setNodeEditorFieldBinding={setNodeEditorFieldBinding}
      setStyleSectionOpenState={setStyleSectionOpenState}
      styleSectionOpenState={styleSectionOpenState}
      tokenMetadata={tokenMetadata}
    />
  );
}
