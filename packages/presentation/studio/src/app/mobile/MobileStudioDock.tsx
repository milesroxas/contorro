"use client";

import {
  IconAdjustments,
  IconLayoutList,
  IconMenu2,
  IconPlus,
} from "@tabler/icons-react";

import { cn } from "../../lib/cn.js";
import type { MobileSheetId } from "./mobile-studio-types.js";

type DockItem = {
  id: MobileSheetId;
  label: string;
  Icon: typeof IconPlus;
  disabled?: boolean;
};

export function MobileStudioDock({
  activeSheet,
  hasSelection,
  onSelect,
}: {
  activeSheet: MobileSheetId | null;
  hasSelection: boolean;
  onSelect: (id: MobileSheetId) => void;
}) {
  const items: DockItem[] = [
    { id: "menu", label: "Menu", Icon: IconMenu2 },
    { id: "add", label: "Add", Icon: IconPlus },
    { id: "layers", label: "Layers", Icon: IconLayoutList },
    {
      id: "inspect",
      label: "Inspect",
      Icon: IconAdjustments,
      disabled: !hasSelection,
    },
  ];

  return (
    <nav
      aria-label="Studio mobile dock"
      className="sticky bottom-0 z-30 flex shrink-0 items-stretch justify-around gap-1 border-t border-border bg-background/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur"
    >
      {items.map(({ id, label, Icon, disabled }) => {
        const isActive = activeSheet === id;
        return (
          <button
            aria-label={label}
            aria-pressed={isActive}
            className={cn(
              "relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground",
              disabled && "opacity-40",
            )}
            disabled={disabled}
            key={id}
            onClick={() => onSelect(id)}
            type="button"
          >
            <Icon aria-hidden className="size-5" stroke={1.8} />
            <span className="leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
