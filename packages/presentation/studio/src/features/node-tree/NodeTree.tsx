"use client";

import { useDraggable } from "@dnd-kit/core";
import type { PageComposition } from "@repo/contracts-zod";
import type { Icon } from "@tabler/icons-react";
import {
  IconChevronDown,
  IconChevronUp,
  IconComponents,
  IconLayoutGrid,
  IconLayoutList,
  IconLayoutRows,
} from "@tabler/icons-react";
import {
  Fragment,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { StudioBulkCollapseButton } from "../../components/studio-panel.js";
import { Button } from "../../components/ui/button.js";
import { cn } from "../../lib/cn.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import { isChildContainerPrimitive } from "../../lib/style-controls.js";
import {
  libraryComponentEditStudioHref,
  libraryDisplayNameForKey,
  useLibraryComponentIndex,
} from "../../lib/use-library-component-labels.js";
import { PrimitiveNodeContextMenu } from "../context-menu/PrimitiveNodeContextMenu.js";
import { InsertionDropZone } from "../dnd/InsertionDropZone.js";

function isTemplateShellSectionTag(
  tag: unknown,
): tag is "header" | "main" | "footer" {
  return tag === "header" || tag === "main" || tag === "footer";
}

function isTemplateShellRoot(composition: PageComposition): boolean {
  const root = composition.nodes[composition.rootId];
  if (!root || root.definitionKey !== "primitive.box") {
    return false;
  }
  const tags = root.childIds
    .map((childId) => composition.nodes[childId]?.propValues?.tag)
    .filter(isTemplateShellSectionTag);
  return (
    tags.includes("header") && tags.includes("main") && tags.includes("footer")
  );
}

function isLockedTemplateShellSection(
  composition: PageComposition,
  nodeId: string,
): boolean {
  if (!isTemplateShellRoot(composition)) {
    return false;
  }
  const node = composition.nodes[nodeId];
  if (!node) {
    return false;
  }
  if (node.parentId !== composition.rootId) {
    return false;
  }
  return isTemplateShellSectionTag(node.propValues?.tag);
}

/**
 * Payload admin base styles add padding on `ul` / `ol`. Reset so this tree’s
 * layout is controlled only here (`!` wins over `payload-default` list rules).
 */
const layerTreeRootListClass = "list-none space-y-0 !p-0";

/** Matches list reset on root; repeated on nested `<li>` for Payload list overrides. */
const layerTreeItemClass = "list-none m-0! p-0! pl-0!";

const treeCollapseIconButtonClass =
  "h-6 w-6 shrink-0 cursor-pointer rounded-sm border border-transparent px-0 text-muted-foreground hover:border-border/70 hover:bg-muted/45 hover:text-foreground";

const layerRowBaseClass =
  "flex min-w-0 items-stretch gap-0 rounded-sm border px-0 py-px transition-colors";

const layerRowSelectedClass =
  "border-border/55 bg-muted/85 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] dark:bg-muted/45 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]";

const layerRowIdleClass =
  "border-transparent hover:bg-muted/45 dark:hover:bg-muted/25";

function layerTreeNestedListClass(isRoot: boolean) {
  return cn(
    "ml-2 list-none space-y-0 border-l border-border/45 !pl-2",
    isRoot ? "mt-0.5" : "mt-0",
  );
}

function DraggableNodeTreeRow({
  nodeId,
  selected,
  onSelect,
  onRemoveNode,
  onWrapNode,
  collapseToggleButton,
  Icon,
  kindTitle,
  labelUseExactCasing,
  layerLabel,
  rootId,
  editComponentHref,
}: {
  nodeId: string;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  collapseToggleButton: ReactNode;
  Icon: Icon;
  kindTitle: string;
  /** Library display names from CMS should not get CSS `capitalize`. */
  labelUseExactCasing?: boolean;
  layerLabel: string;
  rootId: string;
  editComponentHref?: string | null;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `layers:move:${nodeId}`,
    data: { kind: "node" as const, nodeId },
    attributes: {
      role: "group",
      tabIndex: -1,
    },
  });

  return (
    <div
      className={cn("min-w-0", isDragging && "opacity-60")}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      <PrimitiveNodeContextMenu
        editComponentHref={editComponentHref}
        layerIcon={Icon}
        layerLabel={layerLabel}
        nodeId={nodeId}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelect}
        onWrapNode={onWrapNode}
        rootId={rootId}
      >
        <div
          className={cn(
            layerRowBaseClass,
            selected ? layerRowSelectedClass : layerRowIdleClass,
            "touch-none select-none cursor-grab active:cursor-grabbing",
            isDragging && "cursor-grabbing",
          )}
        >
          <Button
            className={cn(
              "min-h-6 min-w-0 flex-1 justify-start hover:bg-transparent focus-visible:ring-offset-0 [&_svg]:size-3.5",
              "!cursor-grab active:!cursor-grabbing",
              isDragging && "!cursor-grabbing",
            )}
            data-testid={`node-tree-${nodeId}`}
            onClick={() => onSelect(nodeId)}
            size="tree"
            type="button"
            variant="ghost"
          >
            <Icon
              aria-hidden
              className="size-3.5 shrink-0 text-muted-foreground opacity-90"
              stroke={1.5}
            />
            <span
              className={cn(
                "min-w-0 flex-1 cursor-inherit truncate text-left font-medium leading-none text-foreground/95",
                labelUseExactCasing ? "normal-case" : "capitalize",
              )}
            >
              {kindTitle}
            </span>
          </Button>
          {collapseToggleButton}
        </div>
      </PrimitiveNodeContextMenu>
    </div>
  );
}

function collectExpandableSubtreeNodeIds(
  composition: PageComposition,
  rootNodeId: string,
): string[] {
  const ids: string[] = [];
  const stack = [rootNodeId];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId) {
      continue;
    }
    const currentNode = composition.nodes[currentId];
    if (!currentNode) {
      continue;
    }
    const isContainer = isChildContainerPrimitive(currentNode.definitionKey);
    if (isContainer && currentNode.childIds.length > 0) {
      ids.push(currentId);
    }
    for (const childId of currentNode.childIds) {
      stack.push(childId);
    }
  }
  return ids;
}

function collectVisibleLayerNodeIds(
  composition: PageComposition,
  collapsedNodeIds: ReadonlySet<string>,
): string[] {
  const visibleNodeIds: string[] = [];
  const visit = (nodeId: string) => {
    const node = composition.nodes[nodeId];
    if (!node) {
      return;
    }
    visibleNodeIds.push(nodeId);
    if (
      !isChildContainerPrimitive(node.definitionKey) ||
      node.childIds.length === 0 ||
      collapsedNodeIds.has(nodeId)
    ) {
      return;
    }
    for (const childId of node.childIds) {
      visit(childId);
    }
  };

  const root = composition.nodes[composition.rootId];
  if (isTemplateShellRoot(composition) && root) {
    visibleNodeIds.push(composition.rootId);
    for (const childId of root.childIds) {
      visit(childId);
    }
    return visibleNodeIds;
  }

  visit(composition.rootId);
  return visibleNodeIds;
}

function collectTemplateShellSectionIds(
  composition: PageComposition,
): string[] {
  const root = composition.nodes[composition.rootId];
  if (!root || !isTemplateShellRoot(composition)) {
    return [];
  }
  return root.childIds.filter((childId) => {
    const child = composition.nodes[childId];
    return Boolean(child && isTemplateShellSectionTag(child.propValues?.tag));
  });
}

function resolveTemplateShellSectionId(
  composition: PageComposition,
  nodeId: string,
): string | null {
  let currentId: string | null = nodeId;
  while (currentId) {
    const currentNode: PageComposition["nodes"][string] | undefined =
      composition.nodes[currentId];
    if (!currentNode) {
      return null;
    }
    if (
      currentNode.parentId === composition.rootId &&
      isTemplateShellSectionTag(currentNode.propValues?.tag)
    ) {
      return currentNode.id;
    }
    currentId = currentNode.parentId;
  }
  return null;
}

function layerTreeGlobalKeyEventIgnored(event: KeyboardEvent): boolean {
  const { target } = event;
  return (
    Boolean(event.metaKey || event.ctrlKey || event.altKey) ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function verticalLayerNeighbor(
  key: "w" | "s",
  visibleNodeIds: string[],
  currentNodeId: string,
): string | null {
  const currentIndex = visibleNodeIds.indexOf(currentNodeId);
  if (currentIndex < 0) {
    return null;
  }
  if (key === "w" && currentIndex > 0) {
    return visibleNodeIds[currentIndex - 1];
  }
  if (key === "s" && currentIndex < visibleNodeIds.length - 1) {
    return visibleNodeIds[currentIndex + 1];
  }
  return null;
}

function nextLayerNodeForChildDrill(args: {
  composition: PageComposition;
  currentNodeId: string;
  collapsedNodeIds: ReadonlySet<string>;
  hasValidSelection: boolean;
  uncollapseNode: (nodeId: string) => void;
}): string | null {
  const {
    composition,
    currentNodeId,
    collapsedNodeIds,
    hasValidSelection,
    uncollapseNode,
  } = args;
  const firstChildId = composition.nodes[currentNodeId]?.childIds.find(
    (childId) => Boolean(composition.nodes[childId]),
  );
  if (firstChildId) {
    if (collapsedNodeIds.has(currentNodeId)) {
      uncollapseNode(currentNodeId);
    }
    return firstChildId;
  }
  if (!hasValidSelection) {
    return currentNodeId;
  }
  return null;
}

function nextLayerNodeForSectionJump(
  key: "q" | "e",
  composition: PageComposition,
  currentNodeId: string,
): string | null {
  const sectionIds = collectTemplateShellSectionIds(composition);
  if (sectionIds.length === 0) {
    return null;
  }
  if (currentNodeId === composition.rootId) {
    return key === "q" ? sectionIds[sectionIds.length - 1] : sectionIds[0];
  }
  const currentSectionId = resolveTemplateShellSectionId(
    composition,
    currentNodeId,
  );
  if (!currentSectionId) {
    return null;
  }
  const currentSectionIndex = sectionIds.indexOf(currentSectionId);
  if (currentSectionIndex < 0) {
    return null;
  }
  if (key === "q" && currentSectionIndex > 0) {
    return sectionIds[currentSectionIndex - 1];
  }
  if (key === "e" && currentSectionIndex < sectionIds.length - 1) {
    return sectionIds[currentSectionIndex + 1];
  }
  return null;
}

function computeNextLayerTreeNodeId(args: {
  key: string;
  composition: PageComposition;
  collapsedNodeIds: ReadonlySet<string>;
  selectedNodeId: string | null;
  uncollapseNode: (nodeId: string) => void;
}): string | null {
  const { key, composition, collapsedNodeIds, selectedNodeId, uncollapseNode } =
    args;
  const visibleNodeIds = collectVisibleLayerNodeIds(
    composition,
    collapsedNodeIds,
  );
  if (visibleNodeIds.length === 0) {
    return null;
  }
  const hasValidSelection = Boolean(
    selectedNodeId && composition.nodes[selectedNodeId],
  );
  const currentNodeId =
    hasValidSelection && selectedNodeId ? selectedNodeId : visibleNodeIds[0];

  if (!hasValidSelection && (key === "w" || key === "a" || key === "s")) {
    return currentNodeId;
  }
  if (key === "w" || key === "s") {
    return verticalLayerNeighbor(
      key as "w" | "s",
      visibleNodeIds,
      currentNodeId,
    );
  }
  if (key === "a") {
    return composition.nodes[currentNodeId]?.parentId ?? null;
  }
  if (key === "d") {
    return nextLayerNodeForChildDrill({
      collapsedNodeIds,
      composition,
      currentNodeId,
      hasValidSelection,
      uncollapseNode,
    });
  }
  if (key === "q" || key === "e") {
    return nextLayerNodeForSectionJump(
      key as "q" | "e",
      composition,
      currentNodeId,
    );
  }
  return null;
}

function layerSubtreeHeadingPresentation(
  semanticTag: string | null,
  defaultIcon: Icon,
  defaultKindTitle: string,
): { Icon: Icon; kindTitle: string } {
  if (semanticTag === "header") {
    return { Icon: IconLayoutList, kindTitle: "Header" };
  }
  if (semanticTag === "main") {
    return { Icon: IconLayoutRows, kindTitle: "Main" };
  }
  if (semanticTag === "footer") {
    return { Icon: IconLayoutGrid, kindTitle: "Footer" };
  }
  return { Icon: defaultIcon, kindTitle: defaultKindTitle };
}

/** Document root: reads as a section heading; nested rows are the editable layer list. */
function RootLayerHeading({
  nodeId,
  kindTitle,
  Icon: LayerIcon,
  selected,
  onSelect,
  rightControls,
}: {
  nodeId: string;
  kindTitle: string;
  Icon: Icon;
  selected: boolean;
  onSelect: (id: string) => void;
  rightControls?: ReactNode;
}) {
  return (
    <div className="mb-0.5">
      <div className="flex w-full min-w-0 items-center gap-1">
        <button
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-sm px-0.5 py-1.5 text-left outline-none transition-colors",
            "hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            selected ? "text-foreground" : "text-muted-foreground",
          )}
          data-testid={`node-tree-${nodeId}`}
          onClick={() => onSelect(nodeId)}
          type="button"
        >
          <LayerIcon
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground opacity-90"
            stroke={1.5}
          />
          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground">
            {kindTitle}
          </span>
        </button>
        {rightControls}
      </div>
    </div>
  );
}

function LayerSubtreeNestedList({
  childIds,
  collapsedNodeIds,
  composition,
  editStudioHrefByKey,
  globalCollapseToggleButton,
  isRoot,
  libraryLabels,
  nodeId,
  onRemoveNode,
  onSelect,
  onWrapNode,
  onSetNodeCollapseState,
  onToggleNodeCollapse,
  pageTemplateStudio,
  selectedNodeId,
}: {
  childIds: string[];
  collapsedNodeIds: Set<string>;
  composition: PageComposition;
  editStudioHrefByKey: Record<string, string>;
  globalCollapseToggleButton?: ReactNode;
  isRoot: boolean;
  libraryLabels: Record<string, string>;
  nodeId: string;
  onRemoveNode: (id: string) => void;
  onSelect: (id: string) => void;
  onWrapNode: (id: string) => void;
  onSetNodeCollapseState: (ids: string[], collapsed: boolean) => void;
  onToggleNodeCollapse: (id: string) => void;
  pageTemplateStudio: boolean;
  selectedNodeId: string | null;
}) {
  if (childIds.length === 0) {
    return (
      <li className={layerTreeItemClass}>
        <InsertionDropZone
          droppableScope="layers"
          parentId={nodeId}
          insertIndex={0}
          variant="empty"
        />
      </li>
    );
  }
  return (
    <>
      <li className={layerTreeItemClass}>
        <InsertionDropZone
          className="py-0"
          droppableScope="layers"
          parentId={nodeId}
          insertIndex={0}
          variant="between"
        />
      </li>
      {childIds.map((cid, i) => (
        <Fragment key={cid}>
          <LayerSubtree
            composition={composition}
            collapsedNodeIds={collapsedNodeIds}
            editStudioHrefByKey={editStudioHrefByKey}
            globalCollapseToggleButton={globalCollapseToggleButton}
            libraryLabels={libraryLabels}
            nodeId={cid}
            onSetNodeCollapseState={onSetNodeCollapseState}
            onToggleNodeCollapse={onToggleNodeCollapse}
            onRemoveNode={onRemoveNode}
            onSelect={onSelect}
            onWrapNode={onWrapNode}
            pageTemplateStudio={pageTemplateStudio}
            selectedNodeId={selectedNodeId}
          />
          <li className={layerTreeItemClass}>
            <InsertionDropZone
              droppableScope="layers"
              parentId={nodeId}
              insertIndex={i + 1}
              variant="between"
            />
          </li>
        </Fragment>
      ))}
    </>
  );
}

function LayerSubtreeChildCollapseButton({
  hasChildren,
  isCollapsed,
  nodeId,
  onToggleNodeCollapse,
}: {
  hasChildren: boolean;
  isCollapsed: boolean;
  nodeId: string;
  onToggleNodeCollapse: (id: string) => void;
}) {
  if (!hasChildren) {
    return null;
  }
  return (
    <Button
      aria-label={isCollapsed ? "Expand children" : "Collapse children"}
      className={treeCollapseIconButtonClass}
      onClick={() => onToggleNodeCollapse(nodeId)}
      onPointerDown={(e) => e.stopPropagation()}
      size="sm"
      type="button"
      variant="ghost"
    >
      {isCollapsed ? (
        <IconChevronDown aria-hidden className="size-3.5" stroke={1.8} />
      ) : (
        <IconChevronUp aria-hidden className="size-3.5" stroke={1.8} />
      )}
    </Button>
  );
}

function LayerSubtreeSectionCollapseButton({
  isLockedSection,
  onSetNodeCollapseState,
  sectionAllCollapsed,
  sectionExpandableIds,
}: {
  isLockedSection: boolean;
  onSetNodeCollapseState: (ids: string[], collapsed: boolean) => void;
  sectionAllCollapsed: boolean;
  sectionExpandableIds: string[];
}) {
  if (!isLockedSection || sectionExpandableIds.length === 0) {
    return null;
  }
  return (
    <Button
      aria-label={
        sectionAllCollapsed ? "Expand all children" : "Collapse all children"
      }
      className={treeCollapseIconButtonClass}
      onClick={() =>
        onSetNodeCollapseState(sectionExpandableIds, !sectionAllCollapsed)
      }
      size="sm"
      type="button"
      variant="ghost"
    >
      {sectionAllCollapsed ? (
        <IconChevronDown aria-hidden className="size-3.5" stroke={1.8} />
      ) : (
        <IconChevronUp aria-hidden className="size-3.5" stroke={1.8} />
      )}
    </Button>
  );
}

function LayerSubtreeLayerRow({
  Icon,
  collapseToggleButton,
  editComponentHref,
  globalCollapseToggleButton,
  isRoot,
  isSectionHeading,
  kindTitle,
  labelUseExactCasing,
  layerLabel,
  nodeId,
  onRemoveNode,
  onSelect,
  onWrapNode,
  rootId,
  sectionToggleButton,
  selected,
}: {
  Icon: Icon;
  collapseToggleButton: ReactNode;
  editComponentHref?: string | null;
  globalCollapseToggleButton?: ReactNode;
  isRoot: boolean;
  isSectionHeading: boolean;
  kindTitle: string;
  labelUseExactCasing?: boolean;
  layerLabel: string;
  nodeId: string;
  onRemoveNode: (id: string) => void;
  onSelect: (id: string) => void;
  onWrapNode: (id: string) => void;
  rootId: string;
  sectionToggleButton: ReactNode;
  selected: boolean;
}) {
  if (isSectionHeading) {
    return (
      <RootLayerHeading
        Icon={Icon}
        kindTitle={kindTitle}
        nodeId={nodeId}
        onSelect={onSelect}
        rightControls={
          isRoot ? globalCollapseToggleButton : sectionToggleButton
        }
        selected={selected}
      />
    );
  }
  return (
    <DraggableNodeTreeRow
      Icon={Icon}
      collapseToggleButton={collapseToggleButton}
      editComponentHref={editComponentHref}
      kindTitle={kindTitle}
      labelUseExactCasing={labelUseExactCasing}
      layerLabel={layerLabel}
      nodeId={nodeId}
      onRemoveNode={onRemoveNode}
      onSelect={onSelect}
      onWrapNode={onWrapNode}
      rootId={rootId}
      selected={selected}
    />
  );
}

function LayerSubtree({
  composition,
  nodeId,
  onRemoveNode,
  onSelect,
  onWrapNode,
  selectedNodeId,
  collapsedNodeIds,
  onToggleNodeCollapse,
  onSetNodeCollapseState,
  editStudioHrefByKey,
  globalCollapseToggleButton,
  libraryLabels,
  pageTemplateStudio,
  topLevelSectionIndex,
}: {
  composition: PageComposition;
  nodeId: string;
  onSelect: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  selectedNodeId: string | null;
  collapsedNodeIds: Set<string>;
  onToggleNodeCollapse: (id: string) => void;
  onSetNodeCollapseState: (ids: string[], collapsed: boolean) => void;
  editStudioHrefByKey: Record<string, string>;
  globalCollapseToggleButton?: ReactNode;
  libraryLabels: Record<string, string>;
  pageTemplateStudio: boolean;
  topLevelSectionIndex?: number;
}) {
  const node = composition.nodes[nodeId];
  if (!node) {
    return null;
  }
  const { Icon: defaultIcon, label: defaultKindTitle } = getPrimitiveDisplay(
    node.definitionKey,
  );
  const isLibraryComponent =
    node.definitionKey === "primitive.libraryComponent";
  const componentKey =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey
      : "";
  const semanticTag =
    typeof node.propValues?.tag === "string" ? node.propValues.tag : null;
  const { Icon, kindTitle } = isLibraryComponent
    ? {
        Icon: IconComponents,
        kindTitle: libraryDisplayNameForKey(libraryLabels, componentKey),
      }
    : layerSubtreeHeadingPresentation(
        semanticTag,
        defaultIcon,
        defaultKindTitle,
      );
  const layerLabel = kindTitle;
  const labelUseExactCasing = isLibraryComponent;
  const isContainer = isChildContainerPrimitive(node.definitionKey);
  const hasChildren = isContainer && node.childIds.length > 0;
  const isRoot = nodeId === composition.rootId;
  const isLockedSection = isLockedTemplateShellSection(composition, nodeId);
  const isSectionHeading = isRoot || isLockedSection;
  const selected = selectedNodeId === nodeId;
  const isCollapsed = hasChildren && collapsedNodeIds.has(nodeId);
  const sectionExpandableIds = useMemo(
    () =>
      isLockedSection
        ? collectExpandableSubtreeNodeIds(composition, nodeId)
        : ([] as string[]),
    [composition, isLockedSection, nodeId],
  );
  const sectionAllCollapsed =
    sectionExpandableIds.length > 0 &&
    sectionExpandableIds.every((id) => collapsedNodeIds.has(id));
  const collapseToggleButton = (
    <LayerSubtreeChildCollapseButton
      hasChildren={hasChildren}
      isCollapsed={isCollapsed}
      nodeId={nodeId}
      onToggleNodeCollapse={onToggleNodeCollapse}
    />
  );
  const sectionToggleButton = (
    <LayerSubtreeSectionCollapseButton
      isLockedSection={isLockedSection}
      onSetNodeCollapseState={onSetNodeCollapseState}
      sectionAllCollapsed={sectionAllCollapsed}
      sectionExpandableIds={sectionExpandableIds}
    />
  );

  const editComponentHref = libraryComponentEditStudioHref(
    editStudioHrefByKey,
    node,
    pageTemplateStudio,
  );

  const row = (
    <LayerSubtreeLayerRow
      Icon={Icon}
      collapseToggleButton={collapseToggleButton}
      editComponentHref={editComponentHref}
      globalCollapseToggleButton={globalCollapseToggleButton}
      isRoot={isRoot}
      isSectionHeading={isSectionHeading}
      kindTitle={kindTitle}
      labelUseExactCasing={labelUseExactCasing}
      layerLabel={layerLabel}
      nodeId={nodeId}
      onRemoveNode={onRemoveNode}
      onSelect={onSelect}
      onWrapNode={onWrapNode}
      rootId={composition.rootId}
      sectionToggleButton={sectionToggleButton}
      selected={selected}
    />
  );
  const topLevelSectionSpacingClass =
    typeof topLevelSectionIndex === "number" && topLevelSectionIndex > 0
      ? "mt-4 border-t border-border/60 pt-4"
      : "";

  return (
    <li className={layerTreeItemClass}>
      <div className={topLevelSectionSpacingClass}>
        {row}
        {isContainer && !isCollapsed ? (
          <ul className={layerTreeNestedListClass(isRoot)}>
            <LayerSubtreeNestedList
              childIds={node.childIds}
              collapsedNodeIds={collapsedNodeIds}
              composition={composition}
              editStudioHrefByKey={editStudioHrefByKey}
              globalCollapseToggleButton={globalCollapseToggleButton}
              isRoot={isRoot}
              libraryLabels={libraryLabels}
              nodeId={nodeId}
              onRemoveNode={onRemoveNode}
              onSelect={onSelect}
              onWrapNode={onWrapNode}
              onSetNodeCollapseState={onSetNodeCollapseState}
              onToggleNodeCollapse={onToggleNodeCollapse}
              pageTemplateStudio={pageTemplateStudio}
              selectedNodeId={selectedNodeId}
            />
          </ul>
        ) : null}
      </div>
    </li>
  );
}

export function NodeTree({
  composition,
  selectedNodeId,
  studioResource,
  onRemoveNode,
  onWrapNode,
  onSelect,
}: {
  composition: PageComposition;
  selectedNodeId: string | null;
  studioResource: "pageTemplate" | "component" | null;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const { editStudioHrefByKey, labels: libraryLabels } =
    useLibraryComponentIndex();
  const pageTemplateStudio = studioResource === "pageTemplate";
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleNodeCollapse = useCallback((id: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  const setNodeCollapseState = useCallback(
    (ids: string[], collapsed: boolean) => {
      if (ids.length === 0) {
        return;
      }
      setCollapsedNodeIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) {
          if (collapsed) {
            next.add(id);
          } else {
            next.delete(id);
          }
        }
        return next;
      });
    },
    [],
  );
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (layerTreeGlobalKeyEventIgnored(event)) {
        return;
      }
      const key = event.key.toLowerCase();
      if (
        key !== "w" &&
        key !== "a" &&
        key !== "s" &&
        key !== "d" &&
        key !== "q" &&
        key !== "e"
      ) {
        return;
      }
      const uncollapseNode = (nodeId: string) => {
        setCollapsedNodeIds((prev) => {
          if (!prev.has(nodeId)) {
            return prev;
          }
          const next = new Set(prev);
          next.delete(nodeId);
          return next;
        });
      };
      const nextNodeId = computeNextLayerTreeNodeId({
        collapsedNodeIds,
        composition,
        key,
        selectedNodeId,
        uncollapseNode,
      });
      if (!nextNodeId || nextNodeId === selectedNodeId) {
        return;
      }
      event.preventDefault();
      onSelect(nextNodeId);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [collapsedNodeIds, composition, onSelect, selectedNodeId]);
  const expandableNodeIds = useMemo(
    () =>
      collectExpandableSubtreeNodeIds(composition, composition.rootId).filter(
        (id) => id !== composition.rootId,
      ),
    [composition],
  );
  const hasExpandableSections = expandableNodeIds.length > 0;
  const allSectionsCollapsed =
    hasExpandableSections &&
    expandableNodeIds.every((id) => collapsedNodeIds.has(id));
  const globalSectionsToggleButton = hasExpandableSections ? (
    <StudioBulkCollapseButton
      allCollapsed={allSectionsCollapsed}
      onClick={() =>
        setNodeCollapseState(expandableNodeIds, !allSectionsCollapsed)
      }
    />
  ) : null;
  const root = composition.nodes[composition.rootId];
  const templateShell = isTemplateShellRoot(composition);
  const topLevelIds =
    templateShell && root
      ? root.childIds.filter((childId) => composition.nodes[childId])
      : [composition.rootId];

  const tree = (
    <ul className={layerTreeRootListClass}>
      {templateShell ? (
        <li className={layerTreeItemClass}>
          <RootLayerHeading
            Icon={IconLayoutGrid}
            kindTitle="body"
            nodeId={composition.rootId}
            onSelect={onSelect}
            rightControls={globalSectionsToggleButton}
            selected={selectedNodeId === composition.rootId}
          />
        </li>
      ) : null}
      {topLevelIds.map((nodeId, index) => (
        <LayerSubtree
          composition={composition}
          collapsedNodeIds={collapsedNodeIds}
          editStudioHrefByKey={editStudioHrefByKey}
          globalCollapseToggleButton={globalSectionsToggleButton}
          key={nodeId}
          libraryLabels={libraryLabels}
          nodeId={nodeId}
          onSetNodeCollapseState={setNodeCollapseState}
          onToggleNodeCollapse={toggleNodeCollapse}
          onRemoveNode={onRemoveNode}
          onSelect={onSelect}
          onWrapNode={onWrapNode}
          pageTemplateStudio={pageTemplateStudio}
          selectedNodeId={selectedNodeId}
          topLevelSectionIndex={index}
        />
      ))}
    </ul>
  );
  return tree;
}
