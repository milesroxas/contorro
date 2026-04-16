"use client";

import type { StyleProperty } from "@repo/contracts-zod";
import {
  stylePropertyDefaultValueLabel,
  styleSectionForProperty,
} from "@repo/domains-composition";
import type { Icon } from "@tabler/icons-react";
import {
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowsHorizontal,
  IconArrowsSplit2,
  IconArrowsVertical,
  IconArrowUp,
  IconLayoutAlignBottom,
  IconLayoutAlignCenter,
  IconLayoutAlignLeft,
  IconLayoutAlignMiddle,
  IconLayoutAlignRight,
  IconLayoutAlignTop,
  IconLayoutDistributeHorizontal,
} from "@tabler/icons-react";

import { cn } from "../../lib/cn.js";

export function utilityValueLabel(
  property: StyleProperty,
  value: string,
): string {
  if (property === "display" && value === "hidden") {
    return "hidden (display: none)";
  }
  if (property === "width" || property === "height") {
    return widthHeightUtilityValueLabel(property, value);
  }
  return value;
}

/** Tailwind `w-*` / `h-*` utility value — same entries as contracts `utilityValuesForStyleProperty`. */
function widthHeightUtilityValueLabel(
  property: "width" | "height",
  value: string,
): string {
  if (value === "full") {
    return "Fill container";
  }
  if (value === "container") {
    return "Container";
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

export function stylePropertyDefaultOptionLabel(
  property: StyleProperty,
): string {
  return stylePropertyDefaultValueLabel(property);
}

export function tokenSemanticLabel(tokenKey: string): string {
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

export function isColorStyleProperty(property: StyleProperty): boolean {
  return (
    styleSectionForProperty(property) === "color" || property === "borderColor"
  );
}

export function colorSwatchStyleForUtility(value: string): {
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

export function ColorOptionLabel({
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

export const FLEX_UTILITY_META: Partial<
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

export function renderUtilityOptionLabel(
  property: StyleProperty,
  value: string,
) {
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

export type FlexIconProperty =
  | "flexDirection"
  | "flexWrap"
  | "justifyContent"
  | "alignItems"
  | "alignSelf";

export function isFlexIconProperty(
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

export function controlOptionButtonClass({
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
