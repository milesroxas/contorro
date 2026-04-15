"use client";

import type { ReactNode } from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../../components/ui/context-menu.js";

export function PrimitiveNodeContextMenu({
  nodeId,
  rootId,
  layerLabel,
  onSelectNode,
  onRemoveNode,
  editComponentHref,
  children,
}: {
  nodeId: string;
  rootId: string;
  /** Short label for the menu header (e.g. primitive kind). */
  layerLabel: string;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  /** When set (e.g. library block on a page template), opens Component studio. */
  editComponentHref?: string | null;
  children: ReactNode;
}) {
  const isRoot = nodeId === rootId;

  return (
    <ContextMenu
      onOpenChange={(open) => {
        if (open) {
          onSelectNode(nodeId);
        }
      }}
    >
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel className="max-w-[240px] truncate font-normal text-sm text-muted-foreground">
          {layerLabel}
        </ContextMenuLabel>
        <ContextMenuSeparator />
        {editComponentHref ? (
          <>
            <ContextMenuItem asChild>
              <a href={editComponentHref}>Edit component</a>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : null}
        <ContextMenuItem
          variant="destructive"
          disabled={isRoot}
          onSelect={() => {
            if (!isRoot) {
              onRemoveNode(nodeId);
            }
          }}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
