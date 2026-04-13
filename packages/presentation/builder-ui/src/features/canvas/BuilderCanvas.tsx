"use client";

import { useDraggable } from "@dnd-kit/core";
import type { TokenMeta } from "@repo/config-tailwind";
import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { resolveStyleBinding } from "@repo/runtime-renderer";
import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  ReactElement,
} from "react";
import { Fragment, forwardRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ScrollArea } from "../../components/scroll-area.js";
import { cn } from "../../lib/cn.js";
import { isChildContainerPrimitive } from "../../lib/style-controls.js";
import { PrimitiveNodeContextMenu } from "../context-menu/PrimitiveNodeContextMenu.js";
import { InsertionDropZone } from "../dnd/InsertionDropZone.js";

type PrimitiveRegistry = typeof defaultPrimitiveRegistry;

function isContainerNode(node: CompositionNode) {
  return isChildContainerPrimitive(node.definitionKey);
}

function containerContentLayout(): CSSProperties {
  return {
    display: "block",
    width: "100%",
    minHeight: "3rem",
    minWidth: 0,
  };
}

/** `contextmenu` targets may be a Text node (no `Element#closest`). */
function contextMenuOriginElement(target: EventTarget | null): Element | null {
  if (!target || !(target instanceof Node)) {
    return null;
  }
  if (target.nodeType === Node.TEXT_NODE) {
    return (target as Text).parentElement;
  }
  return target instanceof Element ? target : null;
}

function ContainerDropZone({
  node,
  children,
}: {
  node: CompositionNode;
  children: React.ReactNode;
}) {
  const isBox = node.definitionKey === "primitive.box";
  const layout = containerContentLayout();
  const childIds = node.childIds;

  return (
    <div
      className={cn("group relative min-w-0")}
      data-testid={isBox ? `drop-target-box-${node.id}` : undefined}
      style={layout}
    >
      {childIds.length === 0 ? (
        <InsertionDropZone parentId={node.id} insertIndex={0} variant="empty" />
      ) : (
        <div className="flex min-h-0 w-full min-w-0 flex-col">
          <InsertionDropZone
            parentId={node.id}
            insertIndex={0}
            variant="between"
          />
          {children}
        </div>
      )}
    </div>
  );
}

/** Renders child nodes; used inside ContainerDropZone when non-empty. */
function ContainerChildList({
  composition,
  childIds,
  parentNode,
  registry,
  selectedNodeId,
  tokenMeta,
  onSelectNode,
  onRemoveNode,
}: {
  composition: PageComposition;
  childIds: string[];
  parentNode: CompositionNode;
  registry: PrimitiveRegistry;
  selectedNodeId: string | null;
  tokenMeta: TokenMeta[];
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
}) {
  return (
    <>
      {childIds.map((cid, i) => (
        <Fragment key={cid}>
          <CanvasNode
            composition={composition}
            nodeId={cid}
            onRemoveNode={onRemoveNode}
            onSelectNode={onSelectNode}
            registry={registry}
            selectedNodeId={selectedNodeId}
            tokenMeta={tokenMeta}
          />
          <InsertionDropZone
            parentId={parentNode.id}
            insertIndex={i + 1}
            variant="between"
          />
        </Fragment>
      ))}
    </>
  );
}

type NodeChromeProps = {
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

const NodeChrome = forwardRef<HTMLDivElement, NodeChromeProps>(
  function NodeChromeInner(
    { selected, onSelect, children, className, ...rest },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          "min-w-0 flex-1 rounded-[2px] outline-none transition-shadow duration-150",
          selected &&
            "z-[2] ring-2 ring-ring ring-offset-2 ring-offset-background",
          className,
        )}
        data-canvas-node=""
        {...rest}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        {children}
      </div>
    );
  },
);

function CanvasNodeFrame({
  composition,
  node,
  onSelectNode,
  onRemoveNode,
  selected,
  children,
}: {
  composition: PageComposition;
  node: CompositionNode;
  selected: boolean;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  children: React.ReactNode;
}) {
  const isRoot = node.id === composition.rootId;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `move:${node.id}`,
    disabled: isRoot,
    data: { kind: "node" as const, nodeId: node.id },
  });

  const layerLabel = `${node.definitionKey.replace("primitive.", "")} · ${node.id.slice(0, 6)}`;

  return (
    <div
      className={cn(
        "relative min-w-0",
        isDragging && "opacity-60",
        !isRoot && "touch-none cursor-grab select-none active:cursor-grabbing",
      )}
      ref={setNodeRef}
      {...(!isRoot ? listeners : {})}
      {...(!isRoot ? attributes : {})}
    >
      <PrimitiveNodeContextMenu
        layerLabel={layerLabel}
        nodeId={node.id}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        rootId={composition.rootId}
      >
        <NodeChrome
          className={isRoot ? "cursor-pointer" : "cursor-inherit"}
          onSelect={() => onSelectNode(node.id)}
          selected={selected}
        >
          {children}
        </NodeChrome>
      </PrimitiveNodeContextMenu>
    </div>
  );
}

function CanvasNode({
  composition,
  nodeId,
  registry,
  selectedNodeId,
  tokenMeta,
  onSelectNode,
  onRemoveNode,
}: {
  composition: PageComposition;
  nodeId: string;
  registry: PrimitiveRegistry;
  selectedNodeId: string | null;
  tokenMeta: TokenMeta[];
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
}): ReactElement | null {
  const node = composition.nodes[nodeId];
  if (!node) {
    return null;
  }

  const Cmp = registry[node.definitionKey];
  if (!Cmp) {
    return null;
  }

  let className: string | undefined;
  let style: CSSProperties | undefined;

  if (node.styleBindingId) {
    const sb = composition.styleBindings[node.styleBindingId];
    if (sb) {
      const r = resolveStyleBinding(sb, tokenMeta);
      if (r.classes) {
        className = r.classes;
      }
      if (Object.keys(r.inlineStyle).length > 0) {
        style = r.inlineStyle as CSSProperties;
      }
    }
  }

  const selected = selectedNodeId === node.id;
  const isContainer = isContainerNode(node);

  const childList = isContainer ? (
    <ContainerChildList
      childIds={node.childIds}
      composition={composition}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      parentNode={node}
      registry={registry}
      selectedNodeId={selectedNodeId}
      tokenMeta={tokenMeta}
    />
  ) : null;

  let primitive: React.ReactNode;

  if (node.definitionKey === "primitive.slot") {
    const slotId =
      typeof node.propValues?.slotId === "string" &&
      node.propValues.slotId.trim() !== ""
        ? node.propValues.slotId.trim()
        : "main";
    primitive = (
      <Cmp className={className} node={node} style={style}>
        <div
          className={cn(
            "flex min-h-[4.5rem] w-full flex-col justify-center rounded-md border-2 border-dashed border-primary/35 bg-muted/25 px-3 py-4 text-center text-xs text-muted-foreground dark:bg-muted/15",
          )}
        >
          <span className="font-medium text-foreground">Layout slot</span>
          <span className="mt-1 font-mono text-[0.65rem] text-muted-foreground">
            {slotId}
          </span>
          <span className="mt-2 text-[0.6rem] leading-snug text-muted-foreground">
            Page blocks fill this region on the live site.
          </span>
        </div>
      </Cmp>
    );
  } else if (node.definitionKey === "primitive.text") {
    const raw =
      typeof node.propValues?.content === "string"
        ? node.propValues.content
        : "";
    const cb = node.contentBinding;
    let fromBinding = "";
    if (cb?.source === "editor" && cb.editorField) {
      fromBinding =
        typeof cb.editorField.defaultValue === "string"
          ? cb.editorField.defaultValue
          : `[${cb.key}]`;
    } else if (cb) {
      fromBinding = `[${cb.key}]`;
    }
    const display = raw || fromBinding;
    const showPlaceholder = display.trim() === "";
    primitive = (
      <span
        className={cn(className, showPlaceholder && "min-h-[1.25em]")}
        data-definition={node.definitionKey}
        style={style}
      >
        {showPlaceholder ? (
          <span className="text-muted-foreground select-none italic">
            Placeholder text
          </span>
        ) : (
          display
        )}
      </span>
    );
  } else {
    const inner = isContainer ? (
      <ContainerDropZone node={node}>{childList}</ContainerDropZone>
    ) : (
      childList
    );

    primitive = (
      <Cmp className={className} node={node} style={style}>
        {inner}
      </Cmp>
    );
  }

  if (node.definitionKey === "primitive.text") {
    return (
      <CanvasNodeFrame
        composition={composition}
        node={node}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        selected={selected}
      >
        {primitive}
      </CanvasNodeFrame>
    );
  }

  if (node.definitionKey === "primitive.image") {
    return (
      <CanvasNodeFrame
        composition={composition}
        node={node}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        selected={selected}
      >
        <div className="inline-block max-w-full">{primitive}</div>
      </CanvasNodeFrame>
    );
  }

  return (
    <CanvasNodeFrame
      composition={composition}
      node={node}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      selected={selected}
    >
      {primitive}
    </CanvasNodeFrame>
  );
}

function CanvasDropRoot({
  children,
  composition,
  onBackgroundPointer,
  onSelectNode,
}: {
  children: React.ReactNode;
  composition: PageComposition;
  onBackgroundPointer?: () => void;
  onSelectNode: (id: string) => void;
}) {
  const [canvasMenu, setCanvasMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasMenu) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCanvasMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canvasMenu]);

  const canvasMenuPortal =
    canvasMenu &&
    typeof document !== "undefined" &&
    createPortal(
      <>
        <div
          aria-hidden
          className="fixed inset-0 z-40"
          onPointerDown={() => setCanvasMenu(null)}
        />
        <div
          className="fixed z-50 min-w-40 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md"
          role="menu"
          style={{ left: canvasMenu.x, top: canvasMenu.y }}
        >
          <div className="max-w-[240px] px-2 py-1.5 font-normal text-xs text-muted-foreground">
            Canvas
          </div>
          <div className="-mx-1 my-1 h-px bg-border" />
          <button
            className="relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none focus:bg-accent focus:text-accent-foreground"
            type="button"
            onClick={() => {
              onSelectNode(composition.rootId);
              setCanvasMenu(null);
            }}
          >
            Select root
          </button>
        </div>
      </>,
      document.body,
    );

  return (
    <>
      <div
        className="relative min-h-[max(100%,14rem)] w-full p-4 transition-colors"
        data-testid="builder-canvas-drop-root"
        onContextMenu={(e) => {
          const origin = contextMenuOriginElement(e.target);
          if (origin?.closest("[data-canvas-node]")) {
            return;
          }
          e.preventDefault();
          setCanvasMenu({ x: e.clientX, y: e.clientY });
        }}
        onPointerDown={(e) => {
          if (e.button !== 0) {
            return;
          }
          if (e.target === e.currentTarget) {
            onBackgroundPointer?.();
          }
        }}
      >
        {children}
      </div>
      {canvasMenuPortal}
    </>
  );
}

export function BuilderCanvas({
  composition,
  selectedNodeId,
  onSelectNode,
  onRemoveNode,
  onCanvasBackground,
  tokenMeta = [],
}: {
  composition: PageComposition;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onCanvasBackground?: () => void;
  tokenMeta?: TokenMeta[];
}) {
  const registry = defaultPrimitiveRegistry;

  const tree = (
    <CanvasNode
      composition={composition}
      nodeId={composition.rootId}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      registry={registry}
      selectedNodeId={selectedNodeId}
      tokenMeta={tokenMeta}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 text-xs font-medium text-muted-foreground">
        Canvas
      </div>
      <ScrollArea className="min-h-0 flex-1 rounded-md border border-border bg-background shadow-sm dark:bg-card/30">
        <CanvasDropRoot
          composition={composition}
          onBackgroundPointer={() => {
            onCanvasBackground?.();
          }}
          onSelectNode={onSelectNode}
        >
          <div className="text-foreground" data-testid="builder-canvas-preview">
            {tree}
          </div>
        </CanvasDropRoot>
      </ScrollArea>
    </div>
  );
}
