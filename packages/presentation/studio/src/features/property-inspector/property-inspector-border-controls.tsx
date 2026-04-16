"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import type {
  CompositionNode,
  PageComposition,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import { utilityValuesForStyleProperty } from "@repo/contracts-zod";
import {
  stylePropertyDefaultValueLabel,
  stylePropertyLabel,
} from "@repo/domains-composition";
import { IconChevronDown, IconX } from "@tabler/icons-react";
import { useState } from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover.js";
import { BorderPropertyRowLabel } from "./property-control-label.js";
import {
  ColorOptionLabel,
  colorSwatchStyleForUtility,
  renderUtilityOptionLabel,
  stylePropertyDefaultOptionLabel,
  tokenSemanticLabel,
  utilityValueLabel,
} from "./property-inspector-style-labels.js";
import {
  readStyleProperty,
  tokensForStyleProperty,
} from "./property-inspector-style-model.js";

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
  const Btn = ({ side, label }: { side: BorderSideKey; label: string }) => {
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

export function BorderControl({
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
