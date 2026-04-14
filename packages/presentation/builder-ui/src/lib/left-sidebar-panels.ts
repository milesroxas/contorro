import type { Icon } from "@tabler/icons-react";
import {
  IconComponents,
  IconLayoutGrid,
  IconLayoutList,
} from "@tabler/icons-react";

/** Left rail panels — order, labels, icons, and digit shortcuts are defined only here. */
export type LeftSidebarPanelId = "primitives" | "layers" | "components";

export type LeftSidebarPanelDef = {
  id: LeftSidebarPanelId;
  label: string;
  Icon: Icon;
  /** Top-row digit (1–9); used when focus is not in an editable field. */
  shortcutDigit: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
};

export const LEFT_SIDEBAR_PANELS: readonly LeftSidebarPanelDef[] = [
  {
    id: "primitives",
    label: "Primitives",
    Icon: IconLayoutGrid,
    shortcutDigit: "1",
  },
  {
    id: "layers",
    label: "Layers",
    Icon: IconLayoutList,
    shortcutDigit: "2",
  },
  {
    id: "components",
    label: "Components",
    Icon: IconComponents,
    shortcutDigit: "3",
  },
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
