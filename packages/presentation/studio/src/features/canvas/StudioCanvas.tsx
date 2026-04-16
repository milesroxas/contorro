"use client";

import { useDndContext, useDraggable } from "@dnd-kit/core";
import type { TokenMeta } from "@repo/config-tailwind";
import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import {
  resolvePrimitiveImageSrcAlt,
  resolvePrimitiveTextContent,
  resolvePrimitiveVideoSrc,
} from "@repo/domains-composition";
import {
  Collection,
  defaultPrimitiveRegistry,
  useOptionalCollectionItemDoc,
} from "@repo/runtime-primitives";
import { resolveNodeStyle } from "@repo/runtime-renderer";
import { IconMoonStars, IconSunHigh } from "@tabler/icons-react";
import type {
  CSSProperties,
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
  ReactNode,
} from "react";
import { Fragment, forwardRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ScrollArea } from "../../components/scroll-area.js";
import { useStudioPortalRoot } from "../../components/studio-root.js";
import { Button } from "../../components/ui/button.js";
import { cn } from "../../lib/cn.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import { isChildContainerPrimitive } from "../../lib/style-controls.js";
import {
  libraryComponentEditStudioHref,
  useLibraryComponentIndex,
} from "../../lib/use-library-component-labels.js";
import { PrimitiveNodeContextMenu } from "../context-menu/PrimitiveNodeContextMenu.js";
import { InsertionDropZone } from "../dnd/InsertionDropZone.js";
import { LibraryCompositionCanvasPreview } from "./library-composition-canvas-preview.js";

type PrimitiveRegistry = typeof defaultPrimitiveRegistry;

function isContainerNode(node: CompositionNode) {
  return isChildContainerPrimitive(node.definitionKey);
}

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
  node: CompositionNode,
): boolean {
  if (!isTemplateShellRoot(composition)) {
    return false;
  }
  if (node.parentId !== composition.rootId) {
    return false;
  }
  return isTemplateShellSectionTag(node.propValues?.tag);
}

function canvasDragContainerOutlineState(args: {
  isContainer: boolean;
  hasActiveDrag: boolean;
  activeDropParentId: string | null;
  nodeId: string;
}): "none" | "idle" | "active" {
  const { isContainer, hasActiveDrag, activeDropParentId, nodeId } = args;
  if (!isContainer || !hasActiveDrag) {
    return "none";
  }
  return activeDropParentId === nodeId ? "active" : "idle";
}

function canvasSlotPrimitive(
  Cmp: ElementType<{
    className?: string;
    node: CompositionNode;
    style?: CSSProperties;
    children?: ReactNode;
  }>,
  node: CompositionNode,
  className: string,
  style: CSSProperties | undefined,
): ReactNode {
  const slotId =
    typeof node.propValues?.slotId === "string" &&
    node.propValues.slotId.trim() !== ""
      ? node.propValues.slotId.trim()
      : "main";
  return (
    <Cmp className={className} node={node} style={style}>
      <div className="relative min-h-[4.5rem] w-full flex-1 shrink-0 p-3">
        <div
          className={cn(
            "flex h-full min-h-[4.5rem] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-accent/35 bg-accent/10 px-4 py-5 text-center text-sm tracking-tight shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] dark:border-accent/28 dark:bg-accent/8 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]",
            "!text-muted-foreground",
          )}
        >
          <span className="!font-semibold !text-foreground">Layout slot</span>
          <span className="mt-1 font-mono text-xs">{slotId}</span>
          <span className="mt-2 text-xs leading-snug">
            Page blocks fill this region on the live site.
          </span>
        </div>
      </div>
    </Cmp>
  );
}

function CanvasStudioTextPrimitive({
  className,
  node,
  style,
}: {
  className: string;
  node: CompositionNode;
  style: CSSProperties | undefined;
}): ReactNode {
  const doc = useOptionalCollectionItemDoc();
  const display = resolvePrimitiveTextContent(node, doc);
  const showPlaceholder = display.trim() === "";
  return (
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
}

function canvasDefaultPrimitive(
  Cmp: ElementType<{
    className?: string;
    node: CompositionNode;
    style?: CSSProperties;
    children?: ReactNode;
  }>,
  node: CompositionNode,
  className: string,
  style: CSSProperties | undefined,
  childList: ReactNode,
): ReactNode {
  return (
    <Cmp className={className} node={node} style={style}>
      {childList}
    </Cmp>
  );
}

function canvasNodePrimitiveMarkup(args: {
  node: CompositionNode;
  Cmp: ElementType<{
    className?: string;
    node: CompositionNode;
    style?: CSSProperties;
    children?: ReactNode;
  }>;
  className: string;
  style: CSSProperties | undefined;
  childList: ReactNode;
}): ReactNode {
  const { node, Cmp, className, style, childList } = args;
  if (node.definitionKey === "primitive.slot") {
    return canvasSlotPrimitive(Cmp, node, className, style);
  }
  if (node.definitionKey === "primitive.text") {
    return (
      <CanvasStudioTextPrimitive
        className={className}
        node={node}
        style={style}
      />
    );
  }
  return canvasDefaultPrimitive(Cmp, node, className, style, childList);
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

function ContainerChildList({
  composition,
  childIds,
  editStudioHrefByKey,
  parentNode,
  registry,
  selectedNodeId,
  studioResource,
  tokenMeta,
  onSelectNode,
  onRemoveNode,
  onWrapNode,
}: {
  composition: PageComposition;
  childIds: string[];
  editStudioHrefByKey: Record<string, string>;
  parentNode: CompositionNode;
  registry: PrimitiveRegistry;
  selectedNodeId: string | null;
  studioResource: "pageTemplate" | "component" | null;
  tokenMeta: TokenMeta[];
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
}) {
  const isTemplateShellRootParent =
    parentNode.id === composition.rootId && isTemplateShellRoot(composition);
  const isNestedBoxParent =
    parentNode.definitionKey === "primitive.box" &&
    !!parentNode.parentId &&
    composition.nodes[parentNode.parentId]?.definitionKey === "primitive.box";

  if (childIds.length === 0) {
    return (
      <InsertionDropZone
        droppableScope="canvas"
        insertIndex={0}
        parentId={parentNode.id}
        showNestedBoxPlaceholder={isNestedBoxParent}
        testId={
          parentNode.definitionKey === "primitive.box" ||
          parentNode.definitionKey === "primitive.section"
            ? `drop-target-box-${parentNode.id}`
            : undefined
        }
        variant="empty"
      />
    );
  }

  if (isTemplateShellRootParent) {
    return (
      <>
        <InsertionDropZone
          droppableScope="canvas"
          insertIndex={0}
          parentId={parentNode.id}
          variant="between"
        />
        {childIds.map((cid, i) => (
          <Fragment key={cid}>
            <CanvasNode
              composition={composition}
              editStudioHrefByKey={editStudioHrefByKey}
              nodeId={cid}
              onRemoveNode={onRemoveNode}
              onSelectNode={onSelectNode}
              onWrapNode={onWrapNode}
              registry={registry}
              selectedNodeId={selectedNodeId}
              studioResource={studioResource}
              tokenMeta={tokenMeta}
            />
            <InsertionDropZone
              droppableScope="canvas"
              insertIndex={i + 1}
              parentId={parentNode.id}
              variant="between"
            />
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <>
      <InsertionDropZone
        droppableScope="canvas"
        parentId={parentNode.id}
        insertIndex={0}
        variant="between"
      />
      {childIds.map((cid, i) => (
        <Fragment key={cid}>
          <CanvasNode
            composition={composition}
            editStudioHrefByKey={editStudioHrefByKey}
            nodeId={cid}
            onRemoveNode={onRemoveNode}
            onSelectNode={onSelectNode}
            onWrapNode={onWrapNode}
            registry={registry}
            selectedNodeId={selectedNodeId}
            studioResource={studioResource}
            tokenMeta={tokenMeta}
          />
          <InsertionDropZone
            droppableScope="canvas"
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
            "z-2 ring-2 ring-ring/85 ring-offset-1 ring-offset-background",
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
  onWrapNode,
  selected,
  dragContainerOutline,
  editComponentHref,
  children,
}: {
  composition: PageComposition;
  node: CompositionNode;
  selected: boolean;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  dragContainerOutline: "none" | "idle" | "active";
  editComponentHref?: string | null;
  children: React.ReactNode;
}) {
  const isRoot = node.id === composition.rootId;
  const isLockedSection = isLockedTemplateShellSection(composition, node);
  const dragDisabled = isRoot || isLockedSection;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `canvas:move:${node.id}`,
    disabled: dragDisabled,
    data: { kind: "node" as const, nodeId: node.id },
  });

  const semanticTag =
    typeof node.propValues?.tag === "string" &&
    isTemplateShellSectionTag(node.propValues.tag)
      ? `${node.propValues.tag.charAt(0).toUpperCase()}${node.propValues.tag.slice(1)}`
      : null;
  const { Icon: layerIcon, label: primitiveLabel } = getPrimitiveDisplay(
    node.definitionKey,
  );
  const kindLabel = semanticTag ?? primitiveLabel;
  const layerLabel = kindLabel;

  return (
    <div
      className={cn(
        "relative min-w-0",
        selected && "z-20",
        isDragging && "opacity-60",
        !dragDisabled &&
          "touch-none cursor-grab select-none active:cursor-grabbing",
      )}
      ref={setNodeRef}
      {...(!dragDisabled ? listeners : {})}
      {...(!dragDisabled ? attributes : {})}
    >
      {dragDisabled ? (
        <NodeChrome
          className="cursor-pointer"
          onSelect={() => onSelectNode(node.id)}
          selected={selected}
        >
          {children}
        </NodeChrome>
      ) : (
        <PrimitiveNodeContextMenu
          editComponentHref={editComponentHref}
          layerIcon={layerIcon}
          layerLabel={layerLabel}
          nodeId={node.id}
          onRemoveNode={onRemoveNode}
          onSelectNode={onSelectNode}
          onWrapNode={onWrapNode}
          rootId={composition.rootId}
        >
          <NodeChrome
            className="cursor-inherit"
            onSelect={() => onSelectNode(node.id)}
            selected={selected}
          >
            {children}
          </NodeChrome>
        </PrimitiveNodeContextMenu>
      )}
      {dragContainerOutline !== "none" ? (
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[2px] border border-dashed transition-colors",
            dragContainerOutline === "active"
              ? "border-primary/85 shadow-[0_0_0_1px_hsl(var(--primary)/0.35)]"
              : "border-primary/45",
          )}
        />
      ) : null}
    </div>
  );
}

function CanvasImageOrVideoNodeFrame({
  composition,
  dragContainerOutline,
  editComponentHref,
  isVideo,
  node,
  onRemoveNode,
  onSelectNode,
  onWrapNode,
  primitive,
  selected,
}: {
  composition: PageComposition;
  dragContainerOutline: "none" | "idle" | "active";
  editComponentHref: string | null | undefined;
  isVideo: boolean;
  node: CompositionNode;
  onRemoveNode: (id: string) => void;
  onSelectNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  primitive: ReactNode;
  selected: boolean;
}): ReactElement {
  const doc = useOptionalCollectionItemDoc();
  const src = isVideo
    ? resolvePrimitiveVideoSrc(node, doc)
    : resolvePrimitiveImageSrcAlt(node, doc).src;
  const hasMediaSource = src.trim().length > 0;
  return (
    <CanvasNodeFrame
      composition={composition}
      dragContainerOutline={dragContainerOutline}
      editComponentHref={editComponentHref ?? undefined}
      node={node}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      onWrapNode={onWrapNode}
      selected={selected}
    >
      {hasMediaSource ? primitive : <div className="py-4">{primitive}</div>}
    </CanvasNodeFrame>
  );
}

function CanvasPrimitiveCollectionBranch({
  childList,
  className,
  composition,
  dragContainerOutline,
  editComponentHref,
  node,
  onRemoveNode,
  onSelectNode,
  onWrapNode,
  selected,
  style,
}: {
  childList: ReactNode;
  className: string | undefined;
  composition: PageComposition;
  dragContainerOutline: "none" | "idle" | "active";
  editComponentHref: string | null | undefined;
  node: CompositionNode;
  onRemoveNode: (id: string) => void;
  onSelectNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  selected: boolean;
  style: CSSProperties | undefined;
}): ReactElement {
  return (
    <CanvasNodeFrame
      composition={composition}
      dragContainerOutline={dragContainerOutline}
      editComponentHref={editComponentHref ?? undefined}
      node={node}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      onWrapNode={onWrapNode}
      selected={selected}
    >
      <div className="relative w-full min-w-0">
        <Collection
          className={cn(className, "w-full")}
          collectionTemplate={childList}
          node={node}
          style={style}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1 right-1 z-10 rounded border border-border/60 bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm"
        >
          Collection
        </div>
      </div>
    </CanvasNodeFrame>
  );
}

function CanvasNode({
  composition,
  nodeId,
  registry,
  selectedNodeId,
  tokenMeta,
  editStudioHrefByKey,
  studioResource,
  onSelectNode,
  onRemoveNode,
  onWrapNode,
}: {
  composition: PageComposition;
  nodeId: string;
  registry: PrimitiveRegistry;
  selectedNodeId: string | null;
  tokenMeta: TokenMeta[];
  editStudioHrefByKey: Record<string, string>;
  studioResource: "pageTemplate" | "component" | null;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
}): ReactElement | null {
  const node = composition.nodes[nodeId];
  if (!node) {
    return null;
  }

  const Cmp = registry[node.definitionKey];
  if (!Cmp) {
    return null;
  }

  const pageTemplateStudio = studioResource === "pageTemplate";
  const editComponentHref = libraryComponentEditStudioHref(
    editStudioHrefByKey,
    node,
    pageTemplateStudio,
  );

  const resolvedNodeStyle = resolveNodeStyle(node, composition, tokenMeta);
  const className = resolvedNodeStyle.className;
  const style = resolvedNodeStyle.style as CSSProperties | undefined;

  const selected = selectedNodeId === node.id;
  const isContainer = isContainerNode(node);
  const { active, over } = useDndContext();
  const hasActiveDrag =
    active?.data.current?.kind === "palette" ||
    active?.data.current?.kind === "node";
  const activeDropParentId =
    over?.data.current?.kind === "insert" ? over.data.current.parentId : null;
  const dragContainerOutline = canvasDragContainerOutlineState({
    activeDropParentId,
    hasActiveDrag,
    isContainer,
    nodeId: node.id,
  });

  if (node.definitionKey === "primitive.libraryComponent") {
    return (
      <CanvasNodeFrame
        composition={composition}
        dragContainerOutline={dragContainerOutline}
        editComponentHref={editComponentHref}
        node={node}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        onWrapNode={onWrapNode}
        selected={selected}
      >
        <LibraryCompositionCanvasPreview
          className={className ?? ""}
          node={node}
          style={style}
          tokenMeta={tokenMeta}
        />
      </CanvasNodeFrame>
    );
  }

  const childList = isContainer ? (
    <ContainerChildList
      childIds={node.childIds}
      composition={composition}
      editStudioHrefByKey={editStudioHrefByKey}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      onWrapNode={onWrapNode}
      parentNode={node}
      registry={registry}
      selectedNodeId={selectedNodeId}
      studioResource={studioResource}
      tokenMeta={tokenMeta}
    />
  ) : null;

  if (node.definitionKey === "primitive.collection") {
    return (
      <CanvasPrimitiveCollectionBranch
        childList={childList}
        className={className}
        composition={composition}
        dragContainerOutline={dragContainerOutline}
        editComponentHref={editComponentHref}
        node={node}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        onWrapNode={onWrapNode}
        selected={selected}
        style={style}
      />
    );
  }

  const primitive = canvasNodePrimitiveMarkup({
    Cmp,
    childList,
    className: className ?? "",
    node,
    style,
  });

  if (node.definitionKey === "primitive.text") {
    return (
      <CanvasNodeFrame
        composition={composition}
        dragContainerOutline={dragContainerOutline}
        editComponentHref={editComponentHref}
        node={node}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        onWrapNode={onWrapNode}
        selected={selected}
      >
        {primitive}
      </CanvasNodeFrame>
    );
  }

  if (
    node.definitionKey === "primitive.image" ||
    node.definitionKey === "primitive.video"
  ) {
    return (
      <CanvasImageOrVideoNodeFrame
        composition={composition}
        dragContainerOutline={dragContainerOutline}
        editComponentHref={editComponentHref}
        isVideo={node.definitionKey === "primitive.video"}
        node={node}
        onRemoveNode={onRemoveNode}
        onSelectNode={onSelectNode}
        onWrapNode={onWrapNode}
        primitive={primitive}
        selected={selected}
      />
    );
  }

  return (
    <CanvasNodeFrame
      composition={composition}
      dragContainerOutline={dragContainerOutline}
      editComponentHref={editComponentHref}
      node={node}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      onWrapNode={onWrapNode}
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
  const studioPortalRoot = useStudioPortalRoot();
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
      studioPortalRoot ?? document.body,
    );

  return (
    <>
      <div
        className="relative min-h-[max(100%,14rem)] w-full p-4 transition-colors"
        data-testid="studio-canvas-drop-root"
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

export function StudioCanvas({
  composition,
  selectedNodeId,
  onSelectNode,
  onRemoveNode,
  onWrapNode,
  onCanvasBackground,
  theme,
  onToggleTheme,
  tokenMeta = [],
  studioResource,
}: {
  composition: PageComposition;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  onCanvasBackground?: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  tokenMeta?: TokenMeta[];
  studioResource: "pageTemplate" | "component" | null;
}) {
  const registry = defaultPrimitiveRegistry;
  const { editStudioHrefByKey } = useLibraryComponentIndex();

  const tree = (
    <CanvasNode
      composition={composition}
      editStudioHrefByKey={editStudioHrefByKey}
      nodeId={composition.rootId}
      onRemoveNode={onRemoveNode}
      onSelectNode={onSelectNode}
      onWrapNode={onWrapNode}
      registry={registry}
      selectedNodeId={selectedNodeId}
      studioResource={studioResource}
      tokenMeta={tokenMeta}
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <div className="text-xs font-medium text-muted-foreground">Canvas</div>
        <Button
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          onClick={onToggleTheme}
          size="sm"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          type="button"
          variant="ghost"
        >
          {theme === "dark" ? (
            <IconSunHigh className="size-4" />
          ) : (
            <IconMoonStars className="size-4" />
          )}
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1 rounded-md border border-border bg-background dark:bg-card/30">
        <CanvasDropRoot
          composition={composition}
          onBackgroundPointer={() => {
            onCanvasBackground?.();
          }}
          onSelectNode={onSelectNode}
        >
          <div className="text-foreground" data-testid="studio-canvas-preview">
            {tree}
          </div>
        </CanvasDropRoot>
      </ScrollArea>
    </div>
  );
}
