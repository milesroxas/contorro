import type { Icon } from "@tabler/icons-react";
import {
  IconComponents,
  IconLayout,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react";

/** Left rail panels — order, labels, icons, and digit shortcuts are defined only here. */
export type LeftSidebarPanelId =
  | "pageTemplates"
  | "layers"
  | "primitives"
  | "components";

export type LeftSidebarPanelDef = {
  id: LeftSidebarPanelId;
  label: string;
  Icon: Icon;
  /** Top-row digit (1–9); used when focus is not in an editable field. */
  shortcutDigit: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
};

/** Page templates + layers (grouped above the separator in the left rail). */
export const LEFT_SIDEBAR_PRIMARY_PANELS: readonly LeftSidebarPanelDef[] = [
  {
    id: "pageTemplates",
    label: "Page templates",
    Icon: IconLayout,
    shortcutDigit: "1",
  },
  {
    id: "layers",
    label: "Layers",
    Icon: IconLayoutList,
    shortcutDigit: "2",
  },
];

/** Primitives + components (below the separator). */
export const LEFT_SIDEBAR_SECONDARY_PANELS: readonly LeftSidebarPanelDef[] = [
  {
    id: "primitives",
    label: "Primitives",
    Icon: IconLayoutGrid,
    shortcutDigit: "3",
  },
  {
    id: "components",
    label: "Components",
    Icon: IconComponents,
    shortcutDigit: "4",
  },
];

export const LEFT_SIDEBAR_PANELS: readonly LeftSidebarPanelDef[] = [
  ...LEFT_SIDEBAR_PRIMARY_PANELS,
  ...LEFT_SIDEBAR_SECONDARY_PANELS,
];

const leftSidebarPanelByShortcutDigit: Readonly<
  Record<string, LeftSidebarPanelId>
> = Object.fromEntries(
  LEFT_SIDEBAR_PANELS.map((p) => [p.shortcutDigit, p.id]),
) as Record<string, LeftSidebarPanelId>;

export function resolveLeftSidebarPanelShortcut(
  key: string,
): LeftSidebarPanelId | undefined {
  return leftSidebarPanelByShortcutDigit[key];
}
