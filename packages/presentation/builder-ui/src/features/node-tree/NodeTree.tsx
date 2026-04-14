"use client";

import type { PageComposition } from "@repo/contracts-zod";
import type { Icon } from "@tabler/icons-react";
import {
  IconLayoutGrid,
  IconLayoutList,
  IconSection,
} from "@tabler/icons-react";
import { Fragment } from "react";

import {
  builderPanelBodyClass,
  builderPanelHeaderClass,
  builderPanelSurfaceClass,
} from "../../components/builder-panel.js";
import { Button } from "../../components/ui/button.js";
import { cn } from "../../lib/cn.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import { isChildContainerPrimitive } from "../../lib/style-controls.js";
import { PrimitiveNodeContextMenu } from "../context-menu/PrimitiveNodeContextMenu.js";
import { InsertionDropZone } from "../dnd/InsertionDropZone.js";
import { NodeDragHandle } from "../dnd/NodeDragHandle.js";

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
const layerTreeRootListClass = "list-none space-y-0.5 !p-0";

function layerTreeNestedListClass(isRoot: boolean) {
  return cn(
    "ml-2 list-none space-y-0.5 border-l border-border/50 !pl-2 dark:border-border/35",
    isRoot ? "mt-1.5" : "mt-0",
  );
}

/** Document root: reads as a section heading; nested rows are the editable layer list. */
function RootLayerHeading({
  nodeId,
  kindTitle,
  shortId,
  Icon: LayerIcon,
  selected,
  onSelect,
}: {
  nodeId: string;
  kindTitle: string;
  shortId: string;
  Icon: Icon;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "border-b pb-2.5 mb-1 transition-colors",
        selected ? "border-primary/40" : "border-border/50",
      )}
    >
      <button
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-sm px-0.5 py-1 text-left outline-none transition-colors",
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
        <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">
            {kindTitle}
          </span>
          <span className="font-mono text-sm leading-none text-muted-foreground tabular-nums">
            {shortId}
          </span>
        </span>
      </button>
    </div>
  );
}

function LayerSubtree({
  composition,
  nodeId,
  onRemoveNode,
  onSelect,
  selectedNodeId,
}: {
  composition: PageComposition;
  nodeId: string;
  onSelect: (id: string) => void;
  onRemoveNode: (id: string) => void;
  selectedNodeId: string | null;
}) {
  const node = composition.nodes[nodeId];
  if (!node) {
    return null;
  }
  const { Icon: defaultIcon, label: defaultKindTitle } = getPrimitiveDisplay(
    node.definitionKey,
  );
  const semanticTag =
    typeof node.propValues?.tag === "string" ? node.propValues.tag : null;
  const Icon =
    semanticTag === "header"
      ? IconLayoutList
      : semanticTag === "main"
        ? IconSection
        : semanticTag === "footer"
          ? IconLayoutGrid
          : defaultIcon;
  const kindTitle =
    semanticTag === "header" ||
    semanticTag === "main" ||
    semanticTag === "footer"
      ? semanticTag
      : defaultKindTitle;
  const kindSlug =
    semanticTag === "header" ||
    semanticTag === "main" ||
    semanticTag === "footer"
      ? semanticTag
      : node.definitionKey.replace("primitive.", "");
  const shortId = node.id.slice(0, 6);
  const layerLabel = `${kindSlug} · ${shortId}`;
  const isContainer = isChildContainerPrimitive(node.definitionKey);
  const isRoot = nodeId === composition.rootId;
  const isLockedSection = isLockedTemplateShellSection(composition, nodeId);
  const isSectionHeading = isRoot || isLockedSection;
  const selected = selectedNodeId === nodeId;

  const row = isSectionHeading ? (
    <RootLayerHeading
      Icon={Icon}
      kindTitle={kindTitle}
      nodeId={nodeId}
      onSelect={onSelect}
      selected={selected}
      shortId={shortId}
    />
  ) : (
    <div
      className={cn(
        "flex min-w-0 items-stretch gap-1 rounded-md border px-0.5 py-px transition-colors",
        selected
          ? "border-border/55 bg-muted/85 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] dark:bg-muted/45 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          : "border-transparent hover:bg-muted/45 dark:hover:bg-muted/25",
      )}
    >
      <NodeDragHandle nodeId={nodeId} />
      <Button
        className="min-h-8 min-w-0 flex-1 px-1.5 hover:bg-transparent focus-visible:ring-offset-0 [&_svg]:size-3.5"
        data-testid={`node-tree-${nodeId}`}
        onClick={() => onSelect(nodeId)}
        size="tree"
        type="button"
        variant="ghost"
      >
        <Icon
          aria-hidden
          className="shrink-0 text-muted-foreground opacity-90"
          stroke={1.5}
        />
        <span className="min-w-0 flex-1 truncate text-left">
          <span className="font-medium capitalize text-foreground/95">
            {kindTitle}
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="font-mono text-sm text-muted-foreground/95 tabular-nums">
            {shortId}
          </span>
        </span>
      </Button>
    </div>
  );

  return (
    <li className="list-none m-0! p-0! pl-0!">
      {isSectionHeading ? (
        row
      ) : (
        <PrimitiveNodeContextMenu
          layerLabel={layerLabel}
          nodeId={nodeId}
          onRemoveNode={onRemoveNode}
          onSelectNode={onSelect}
          rootId={composition.rootId}
        >
          {row}
        </PrimitiveNodeContextMenu>
      )}
      {isContainer ? (
        <ul className={layerTreeNestedListClass(isRoot)}>
          <li className="list-none m-0! p-0! pl-0!">
            <InsertionDropZone
              className="py-0"
              parentId={nodeId}
              insertIndex={0}
              variant="between"
            />
          </li>
          {node.childIds.map((cid, i) => (
            <Fragment key={cid}>
              <LayerSubtree
                composition={composition}
                nodeId={cid}
                onRemoveNode={onRemoveNode}
                onSelect={onSelect}
                selectedNodeId={selectedNodeId}
              />
              <li className="list-none m-0! p-0! pl-0!">
                <InsertionDropZone
                  parentId={nodeId}
                  insertIndex={i + 1}
                  variant="between"
                />
              </li>
            </Fragment>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function NodeTree({
  composition,
  selectedNodeId,
  onRemoveNode,
  onSelect,
  embedded = false,
}: {
  composition: PageComposition;
  selectedNodeId: string | null;
  onRemoveNode: (id: string) => void;
  onSelect: (id: string) => void;
  embedded?: boolean;
}) {
  const root = composition.nodes[composition.rootId];
  const templateShell = isTemplateShellRoot(composition);
  const topLevelIds =
    templateShell && root
      ? root.childIds.filter((childId) => composition.nodes[childId])
      : [composition.rootId];

  const tree = (
    <ul className={layerTreeRootListClass}>
      {topLevelIds.map((nodeId) => (
        <LayerSubtree
          composition={composition}
          key={nodeId}
          nodeId={nodeId}
          onRemoveNode={onRemoveNode}
          onSelect={onSelect}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </ul>
  );

  if (embedded) {
    return tree;
  }

  return (
    <div className={builderPanelSurfaceClass}>
      <div className={builderPanelHeaderClass}>Layers</div>
      <div className={builderPanelBodyClass}>{tree}</div>
    </div>
  );
}
