"use client";

import type { StyleProperty, StylePropertyEntry } from "@repo/contracts-zod";
import { utilityValuesForStyleProperty } from "@repo/contracts-zod";
import {
  stylePropertyDefaultValueLabel,
  stylePropertyLabel,
} from "@repo/domains-composition";
import { useState } from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover.js";
import type { FlexIconProperty } from "./property-inspector-style-labels.js";
import {
  controlOptionButtonClass,
  FLEX_UTILITY_META,
  stylePropertyDefaultOptionLabel,
  utilityValueLabel,
} from "./property-inspector-style-labels.js";

export function FlexIconStyleValueControl({
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

export function DisplayStyleValueControl({
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
