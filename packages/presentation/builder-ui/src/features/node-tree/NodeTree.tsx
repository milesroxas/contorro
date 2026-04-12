"use client";

import type { PageComposition } from "@repo/contracts-zod";
import type { Icon } from "@tabler/icons-react";
import { Fragment } from "react";

import {
  builderPanelBodyClass,
  builderPanelHeaderClass,
  builderPanelSurfaceClass,
} from "../../components/builder-panel.js";
import { Button } from "../../components/ui/button.js";
import { cn } from "../../lib/cn.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import { PrimitiveNodeContextMenu } from "../context-menu/PrimitiveNodeContextMenu.js";
import { InsertionDropZone } from "../dnd/InsertionDropZone.js";
import { NodeDragHandle } from "../dnd/NodeDragHandle.js";

const CONTAINER_KEYS = new Set([
  "primitive.box",
  "primitive.stack",
  "primitive.grid",
]);

/**
 * Payload admin base styles add padding on `ul` / `ol`. Reset so this tree’s
 * layout is controlled only here (`!` wins over `payload-default` list rules).
 */
const layerTreeRootListClass = "list-none space-y-0 !p-0";

function layerTreeNestedListClass(isRoot: boolean) {
  return cn(
    "ml-1 list-none space-y-0 border-l border-border/45 !pl-1.5 dark:border-border/30",
    isRoot ? "mt-2" : "mt-0.5",
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
        "border-b pb-2.5 transition-colors",
        selected ? "border-primary/40" : "border-border/50",
      )}
    >
      <button
        className={cn(
          "flex w-full min-w-0 items-center gap-2 rounded-sm px-0 py-1 text-left outline-none transition-colors",
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
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-foreground">
            {kindTitle}
          </span>
          <span className="font-mono text-[10px] leading-none text-muted-foreground tabular-nums">
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
  const { Icon, label: kindTitle } = getPrimitiveDisplay(node.definitionKey);
  const kindSlug = node.definitionKey.replace("primitive.", "");
  const shortId = node.id.slice(0, 6);
  const layerLabel = `${kindSlug} · ${shortId}`;
  const isContainer = CONTAINER_KEYS.has(node.definitionKey);
  const isRoot = nodeId === composition.rootId;
  const selected = selectedNodeId === nodeId;

  const row = isRoot ? (
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
        "flex min-w-0 items-stretch gap-0.5 rounded-md border transition-colors",
        selected
          ? "border-border/50 bg-muted/85 text-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.07)] dark:bg-muted/45 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
          : "border-transparent hover:bg-muted/45 dark:hover:bg-muted/25",
      )}
    >
      <NodeDragHandle nodeId={nodeId} />
      <Button
        className="min-w-0 flex-1 hover:bg-transparent focus-visible:ring-offset-0 [&_svg]:size-3.5"
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
          <span className="font-mono text-[10px] text-muted-foreground/95 tabular-nums">
            {shortId}
          </span>
        </span>
      </Button>
    </div>
  );

  return (
    <li className="list-none !m-0 !p-0 !pl-0">
      <PrimitiveNodeContextMenu
        layerLabel={layerLabel}
        nodeId={nodeId}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelect}
        rootId={composition.rootId}
      >
        {row}
      </PrimitiveNodeContextMenu>
      {isContainer ? (
        <ul className={layerTreeNestedListClass(isRoot)}>
          <li className="list-none !m-0 !p-0 !pl-0">
            <InsertionDropZone
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
              <li className="list-none !m-0 !p-0 !pl-0">
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
  const tree = (
    <ul className={layerTreeRootListClass}>
      <LayerSubtree
        composition={composition}
        nodeId={composition.rootId}
        onRemoveNode={onRemoveNode}
        onSelect={onSelect}
        selectedNodeId={selectedNodeId}
      />
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
