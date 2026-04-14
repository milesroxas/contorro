"use client";

import { IconKeyboard, IconX } from "@tabler/icons-react";
import { Fragment, type ReactNode } from "react";

import { Button } from "../../components/ui/button.js";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "../../components/ui/drawer.js";
import { Separator } from "../../components/ui/separator.js";
import { cn } from "../../lib/cn.js";

type ShortcutItem = {
  action: string;
  detail: string;
  combos: readonly (readonly string[])[];
};

type ShortcutSection = {
  title: string;
  description: string;
  shortcuts: readonly ShortcutItem[];
};

const SHORTCUT_SECTIONS: readonly ShortcutSection[] = [
  {
    title: "Layer navigation",
    description: "Move through the node tree without leaving the keyboard.",
    shortcuts: [
      {
        action: "Walk up visible layers",
        detail: "Moves to the previous visible row in the layers panel.",
        combos: [["W"]],
      },
      {
        action: "Walk down visible layers",
        detail: "Moves to the next visible row in the layers panel.",
        combos: [["S"]],
      },
      {
        action: "Go to parent node",
        detail: "Escapes one level up from the currently selected node.",
        combos: [["A"]],
      },
      {
        action: "Enter child node",
        detail: "Jumps into the first child and expands collapsed parents.",
        combos: [["D"]],
      },
      {
        action: "Header / Main / Footer jump",
        detail: "Moves between top-level shell sections.",
        combos: [["Q"], ["E"]],
      },
    ],
  },
  {
    title: "Builder controls",
    description: "Core editing and panel shortcuts for fast authoring.",
    shortcuts: [
      {
        action: "Open Primitives / Layers / Components",
        detail: "Switches left sidebar tabs.",
        combos: [["1"], ["2"], ["3"]],
      },
      {
        action: "Delete selected node",
        detail: "Removes the currently selected node.",
        combos: [["Delete"], ["Backspace"]],
      },
      {
        action: "Undo",
        detail: "Reverts the most recent edit.",
        combos: [
          ["Cmd", "Z"],
          ["Ctrl", "Z"],
        ],
      },
      {
        action: "Redo",
        detail: "Re-applies an undone edit.",
        combos: [
          ["Cmd", "Shift", "Z"],
          ["Ctrl", "Shift", "Z"],
          ["Ctrl", "Y"],
        ],
      },
    ],
  },
];

function ShortcutKey({ children }: { children: ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-border/75 bg-muted/70 px-2 font-mono text-[11px] font-semibold leading-none text-foreground",
        "shadow-[inset_0_-1px_0_rgba(0,0,0,0.16)] dark:shadow-[inset_0_-1px_0_rgba(0,0,0,0.38)]",
      )}
    >
      {children}
    </kbd>
  );
}

function ShortcutCombo({ keys }: { keys: readonly string[] }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted/35 p-1">
      {keys.map((key, keyIndex) => (
        <span
          className="inline-flex items-center gap-1"
          key={`${keys.join("+")}-${key}`}
        >
          {keyIndex > 0 ? (
            <span className="text-xs font-medium text-muted-foreground">+</span>
          ) : null}
          <ShortcutKey>{key}</ShortcutKey>
        </span>
      ))}
    </span>
  );
}

function ShortcutRow({
  action,
  detail,
  combos,
}: {
  action: string;
  detail: string;
  combos: readonly (readonly string[])[];
}) {
  return (
    <div className="grid gap-3 py-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{action}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
        {combos.map((combo, comboIndex) => (
          <span
            className="inline-flex items-center gap-1.5"
            key={`${action}-${combo.join("+")}`}
          >
            {comboIndex > 0 ? (
              <span className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                or
              </span>
            ) : null}
            <ShortcutCombo keys={combo} />
          </span>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsDrawer() {
  return (
    <Drawer direction="bottom">
      <DrawerTrigger asChild>
        <button
          aria-label="Keyboard shortcuts"
          className={cn(
            "flex size-10 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors",
            "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
          title="Keyboard shortcuts"
          type="button"
        >
          <IconKeyboard aria-hidden className="size-5.5" stroke={1.7} />
        </button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="flex min-h-0 w-full flex-1 flex-col">
          <DrawerHeader className="border-b border-border/70 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DrawerTitle className="flex items-center gap-2">
                  <IconKeyboard
                    aria-hidden
                    className="size-4.5 text-muted-foreground"
                  />
                  Keyboard shortcuts
                </DrawerTitle>
                <DrawerDescription className="mt-1 leading-relaxed">
                  Fast actions for the builder. Shortcuts run while focus is
                  outside text inputs.
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button
                  aria-label="Close keyboard shortcuts"
                  className="size-8 shrink-0"
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  <IconX aria-hidden className="size-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {SHORTCUT_SECTIONS.map((section) => (
                <section className="space-y-2.5" key={section.title}>
                  <div>
                    <h3 className="text-xs font-semibold tracking-wide text-foreground uppercase">
                      {section.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {section.description}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    {section.shortcuts.map((shortcut, shortcutIndex) => (
                      <Fragment key={shortcut.action}>
                        <ShortcutRow
                          action={shortcut.action}
                          combos={shortcut.combos}
                          detail={shortcut.detail}
                        />
                        {shortcutIndex < section.shortcuts.length - 1 ? (
                          <Separator />
                        ) : null}
                      </Fragment>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
          <DrawerFooter className="border-t border-border/70">
            <p className="text-xs text-muted-foreground">
              Tip: keep one node selected in Layers for the fastest keyboard
              navigation flow.
            </p>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
