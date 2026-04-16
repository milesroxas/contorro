"use client";

import type { PageComposition } from "@repo/contracts-zod";

import { NodeTree } from "../features/node-tree/NodeTree.js";
import { LibraryComponentCatalog } from "../features/primitive-catalog/LibraryComponentCatalog.js";
import { PrimitiveCatalog } from "../features/primitive-catalog/PrimitiveCatalog.js";
import { cn } from "../lib/cn.js";
import type { LeftSidebarPanelId } from "../lib/left-sidebar-panels.js";

/**
 * Renders the active left sidebar tab. While a palette drag is in progress we keep
 * the catalog being dragged ({@link PrimitiveCatalog} or {@link LibraryComponentCatalog})
 * mounted off-screen so @dnd-kit drag sources stay alive when the UI switches to Layers —
 * without permanently mounting every tab.
 */
export function StudioLeftSidebarPanelBody({
  activeLeftSidebarPanel,
  activePaletteKey,
  composition,
  onRemoveNode,
  onSelect,
  onWrapNode,
  selectedNodeId,
  studioResource,
}: {
  activeLeftSidebarPanel: LeftSidebarPanelId;
  activePaletteKey: string | null;
  composition: PageComposition;
  onRemoveNode: (id: string) => void;
  onSelect: (id: string | null) => void;
  onWrapNode: (id: string) => void;
  selectedNodeId: string | null;
  studioResource: "pageTemplate" | "component" | null;
}) {
  const keepPrimitiveCatalogMounted =
    activeLeftSidebarPanel === "primitives" ||
    (activePaletteKey !== null &&
      activePaletteKey !== "primitive.libraryComponent");
  const keepComponentCatalogMounted =
    activeLeftSidebarPanel === "components" ||
    activePaletteKey === "primitive.libraryComponent";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      {keepPrimitiveCatalogMounted ? (
        <div
          aria-hidden={activeLeftSidebarPanel !== "primitives"}
          className={cn(
            "flex flex-col",
            activeLeftSidebarPanel === "primitives"
              ? "min-h-0 flex-1 overflow-auto"
              : "pointer-events-none fixed top-0 -left-[10000px] z-0 w-[min(24rem,100vw)] opacity-0 select-none",
          )}
        >
          <PrimitiveCatalog />
        </div>
      ) : null}
      {activeLeftSidebarPanel === "layers" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-auto">
          <NodeTree
            composition={composition}
            onRemoveNode={onRemoveNode}
            onSelect={onSelect}
            onWrapNode={onWrapNode}
            selectedNodeId={selectedNodeId}
            studioResource={studioResource}
          />
        </div>
      ) : null}
      {keepComponentCatalogMounted ? (
        <div
          aria-hidden={activeLeftSidebarPanel !== "components"}
          className={cn(
            "flex flex-col",
            activeLeftSidebarPanel === "components"
              ? "min-h-0 flex-1 overflow-auto"
              : "pointer-events-none fixed top-0 -left-[10000px] z-0 w-[min(24rem,100vw)] opacity-0 select-none",
          )}
        >
          <LibraryComponentCatalog />
        </div>
      ) : null}
    </div>
  );
}
