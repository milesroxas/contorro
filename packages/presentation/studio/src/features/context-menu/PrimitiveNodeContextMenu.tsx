"use client";

import type { Icon } from "@tabler/icons-react";
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
  layerIcon: LayerIcon,
  onSelectNode,
  onRemoveNode,
  onWrapNode,
  editComponentHref,
  children,
}: {
  nodeId: string;
  rootId: string;
  /** Short label for the menu header (e.g. primitive kind). */
  layerLabel: string;
  layerIcon: Icon;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode?: (id: string) => void;
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
        <ContextMenuLabel className="max-w-[240px] pr-2">
          <span className="flex min-w-0 items-center gap-2">
            <LayerIcon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground"
              stroke={1.7}
            />
            <span className="min-w-0 truncate text-sm font-semibold text-foreground">
              {layerLabel}
            </span>
          </span>
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
        {onWrapNode ? (
          <>
            <ContextMenuItem
              disabled={isRoot}
              onSelect={() => {
                if (!isRoot) {
                  onWrapNode(nodeId);
                }
              }}
            >
              Wrap primitive
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
