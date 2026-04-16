"use client";

import type {
  CompositionNode,
  PageComposition,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import { utilityValuesForStyleProperty } from "@repo/contracts-zod";
import { IconRestore } from "@tabler/icons-react";
import { useState } from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import { Button } from "../../components/ui/button.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.js";
import { cn } from "../../lib/cn.js";
import { readStyleProperty } from "./property-inspector-style-model.js";

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

const _SPACING_SIDE_SHORT_LABEL: Record<SpacingSideKey, string> = {
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
            "inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-sm border bg-background px-2 text-[11px] font-semibold leading-none hover:bg-accent/40 disabled:opacity-50",
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
          className={`inline-flex h-8 min-w-[72px] shrink-0 items-center justify-center rounded-sm border bg-background px-2 text-[11px] font-semibold leading-none hover:bg-accent/40 disabled:opacity-50 ${
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

export function SpacingBoxControl({
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
    useState<SpacingShorthandProperty>("padding");

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
        <TabsTrigger value="padding">Padding</TabsTrigger>
        <TabsTrigger value="margin">Margin</TabsTrigger>
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
