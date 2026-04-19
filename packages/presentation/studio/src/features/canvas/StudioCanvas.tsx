"use client";

import { useDndContext, useDraggable } from "@dnd-kit/core";
import type { TokenMeta } from "@repo/config-tailwind";
import {
  BREAKPOINT_MIN_WIDTH_PX,
  BREAKPOINTS,
  type Breakpoint,
  type CompositionNode,
  type PageComposition,
} from "@repo/contracts-zod";
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
import {
  IconAdjustments,
  IconMoonStars,
  IconSunHigh,
} from "@tabler/icons-react";
import type {
  ComponentPropsWithoutRef,
  CSSProperties,
  ElementType,
  ReactElement,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
} from "react";
import {
  Fragment,
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "../../components/ui/popover.js";
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
import {
  defaultCanvasViewportWidthPx,
  normalizeCanvasFontSizePx,
  normalizeCanvasViewportWidthPx,
  normalizeCanvasZoomPercent,
} from "./studio-canvas-viewport.js";

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
  stylePreviewFlattenToBreakpoint,
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
  stylePreviewFlattenToBreakpoint: Breakpoint | undefined;
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
              stylePreviewFlattenToBreakpoint={stylePreviewFlattenToBreakpoint}
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
            stylePreviewFlattenToBreakpoint={stylePreviewFlattenToBreakpoint}
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
  stylePreviewFlattenToBreakpoint,
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
  stylePreviewFlattenToBreakpoint: Breakpoint | undefined;
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

  const resolvedNodeStyle = resolveNodeStyle(
    node,
    composition,
    tokenMeta,
    stylePreviewFlattenToBreakpoint !== undefined
      ? { studioPreviewFlattenToBreakpoint: stylePreviewFlattenToBreakpoint }
      : undefined,
  );
  const className = resolvedNodeStyle.className;

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
          stylePreviewFlattenToBreakpoint={stylePreviewFlattenToBreakpoint}
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
      stylePreviewFlattenToBreakpoint={stylePreviewFlattenToBreakpoint}
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
      />
    );
  }

  const primitive = canvasNodePrimitiveMarkup({
    Cmp,
    childList,
    className: className ?? "",
    node,
    style: undefined,
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

const BREAKPOINT_SWITCHER_LABELS: Record<Breakpoint | "base", string> = {
  base: "Base",
  sm: "SM",
  md: "MD",
  lg: "LG",
  xl: "XL",
};

function parseNumericInput(value: string): number | null {
  const parsed = Number(value.trim());
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function CanvasViewportControlPopover({
  viewportWidthPx,
  viewportZoomPercent,
  viewportFontSizePx,
  onViewportWidthChange,
  onViewportZoomChange,
  onViewportFontSizeChange,
}: {
  viewportWidthPx: number;
  viewportZoomPercent: number;
  viewportFontSizePx: number;
  onViewportWidthChange: (widthPx: number) => void;
  onViewportZoomChange: (zoomPercent: number) => void;
  onViewportFontSizeChange: (fontSizePx: number) => void;
}) {
  const widthInputId = useId();
  const zoomInputId = useId();
  const fontSizeInputId = useId();
  const [widthInput, setWidthInput] = useState(`${viewportWidthPx}`);
  const [zoomInput, setZoomInput] = useState(`${viewportZoomPercent}`);
  const [fontSizeInput, setFontSizeInput] = useState(`${viewportFontSizePx}`);

  useEffect(() => {
    setWidthInput(`${viewportWidthPx}`);
  }, [viewportWidthPx]);

  useEffect(() => {
    setZoomInput(`${viewportZoomPercent}`);
  }, [viewportZoomPercent]);

  useEffect(() => {
    setFontSizeInput(`${viewportFontSizePx}`);
  }, [viewportFontSizePx]);

  const commitNumberField = (
    rawValue: string,
    fallbackValue: number,
    normalize: (value: number) => number,
    onCommit: (value: number) => void,
    setInputValue: (value: string) => void,
  ) => {
    const parsed = parseNumericInput(rawValue);
    if (parsed === null) {
      setInputValue(`${fallbackValue}`);
      return;
    }
    const next = normalize(parsed);
    onCommit(next);
    setInputValue(`${next}`);
  };

  const onNumberFieldKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement>,
    commit: () => void,
  ) => {
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    commit();
    event.currentTarget.blur();
  };

  const commitWidth = () => {
    commitNumberField(
      widthInput,
      viewportWidthPx,
      normalizeCanvasViewportWidthPx,
      onViewportWidthChange,
      setWidthInput,
    );
  };
  const commitZoom = () => {
    commitNumberField(
      zoomInput,
      viewportZoomPercent,
      normalizeCanvasZoomPercent,
      onViewportZoomChange,
      setZoomInput,
    );
  };
  const commitFontSize = () => {
    commitNumberField(
      fontSizeInput,
      viewportFontSizePx,
      normalizeCanvasFontSizePx,
      onViewportFontSizeChange,
      setFontSizeInput,
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" type="button" variant="outline">
          <IconAdjustments aria-hidden className="size-4" />
          <span className="hidden text-xs sm:inline">
            {viewportWidthPx}px / {viewportZoomPercent}% / {viewportFontSizePx}
            px
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64" sideOffset={8}>
        <PopoverHeader>
          <PopoverTitle>Canvas preview controls</PopoverTitle>
        </PopoverHeader>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-1.5">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={widthInputId}
            >
              Viewport width (px)
            </Label>
            <Input
              className="h-8 text-sm"
              id={widthInputId}
              inputMode="numeric"
              onBlur={commitWidth}
              onChange={(event) => setWidthInput(event.target.value)}
              onKeyDown={(event) => onNumberFieldKeyDown(event, commitWidth)}
              value={widthInput}
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={zoomInputId}
            >
              Browser zoom (%)
            </Label>
            <Input
              className="h-8 text-sm"
              id={zoomInputId}
              inputMode="numeric"
              onBlur={commitZoom}
              onChange={(event) => setZoomInput(event.target.value)}
              onKeyDown={(event) => onNumberFieldKeyDown(event, commitZoom)}
              value={zoomInput}
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={fontSizeInputId}
            >
              Default font size (px)
            </Label>
            <Input
              className="h-8 text-sm"
              id={fontSizeInputId}
              inputMode="numeric"
              onBlur={commitFontSize}
              onChange={(event) => setFontSizeInput(event.target.value)}
              onKeyDown={(event) => onNumberFieldKeyDown(event, commitFontSize)}
              value={fontSizeInput}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function StudioCanvas({
  activeBreakpoint,
  canvasViewportWidthPx,
  canvasZoomPercent,
  canvasFontSizePx,
  composition,
  selectedNodeId,
  onSelectNode,
  onRemoveNode,
  onWrapNode,
  onCanvasBackground,
  onActiveBreakpointChange,
  onCanvasViewportWidthPxChange,
  onCanvasZoomPercentChange,
  onCanvasFontSizePxChange,
  theme,
  onToggleTheme,
  tokenMeta = [],
  studioResource,
}: {
  activeBreakpoint: Breakpoint | null;
  canvasViewportWidthPx: number;
  canvasZoomPercent: number;
  canvasFontSizePx: number;
  composition: PageComposition;
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onRemoveNode: (id: string) => void;
  onWrapNode: (id: string) => void;
  onCanvasBackground?: () => void;
  onActiveBreakpointChange: (breakpoint: Breakpoint | null) => void;
  onCanvasViewportWidthPxChange: (widthPx: number) => void;
  onCanvasZoomPercentChange: (zoomPercent: number) => void;
  onCanvasFontSizePxChange: (fontSizePx: number) => void;
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
      stylePreviewFlattenToBreakpoint={activeBreakpoint ?? undefined}
      tokenMeta={tokenMeta}
    />
  );

  const viewportBoundsRef = useRef<HTMLDivElement | null>(null);
  const didInitializeViewportWidthRef = useRef(false);
  const viewportResizeStateRef = useRef<{
    startX: number;
    startWidthPx: number;
    startAutoFitScale: number;
  } | null>(null);
  const [viewportBoundsWidthPx, setViewportBoundsWidthPx] = useState<
    number | null
  >(null);
  const [isViewportResizing, setIsViewportResizing] = useState(false);

  const normalizedZoomPercent = normalizeCanvasZoomPercent(canvasZoomPercent);
  const normalizedFontSizePx = normalizeCanvasFontSizePx(canvasFontSizePx);
  const viewportLogicalWidthPx = normalizeCanvasViewportWidthPx(
    canvasViewportWidthPx,
  );
  const viewportAvailableWidthPx = Math.max(
    1,
    Math.round(viewportBoundsWidthPx ?? viewportLogicalWidthPx),
  );
  const autoFitScale = Math.min(
    1,
    viewportAvailableWidthPx / viewportLogicalWidthPx,
  );
  const zoomScale = normalizedZoomPercent / 100;
  const combinedCanvasScale = zoomScale * autoFitScale;
  const zoomAdjustedViewportWidthPx = Math.max(
    1,
    Math.round(viewportLogicalWidthPx / zoomScale),
  );
  const viewportRenderedWidthPx = Math.max(
    1,
    Math.round(viewportLogicalWidthPx * autoFitScale),
  );

  useEffect(() => {
    const host = viewportBoundsRef.current;
    if (!host || typeof ResizeObserver === "undefined") {
      return;
    }
    const updateBounds = () => {
      setViewportBoundsWidthPx(Math.round(host.getBoundingClientRect().width));
    };
    updateBounds();
    const observer = new ResizeObserver(() => {
      updateBounds();
    });
    observer.observe(host);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (didInitializeViewportWidthRef.current) {
      return;
    }
    if (viewportBoundsWidthPx === null) {
      return;
    }
    const expectedDefaultWidth = defaultCanvasViewportWidthPx(activeBreakpoint);
    const currentWidth = normalizeCanvasViewportWidthPx(canvasViewportWidthPx);
    if (currentWidth !== expectedDefaultWidth) {
      didInitializeViewportWidthRef.current = true;
      return;
    }
    onCanvasViewportWidthPxChange(
      normalizeCanvasViewportWidthPx(viewportBoundsWidthPx),
    );
    didInitializeViewportWidthRef.current = true;
  }, [
    activeBreakpoint,
    canvasViewportWidthPx,
    onCanvasViewportWidthPxChange,
    viewportBoundsWidthPx,
  ]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const resizeState = viewportResizeStateRef.current;
      if (!resizeState) {
        return;
      }
      const scale =
        resizeState.startAutoFitScale > 0 ? resizeState.startAutoFitScale : 1;
      const delta = (event.clientX - resizeState.startX) / scale;
      const next = normalizeCanvasViewportWidthPx(
        resizeState.startWidthPx + delta,
      );
      onCanvasViewportWidthPxChange(next);
    };
    const stopResize = () => {
      if (!viewportResizeStateRef.current) {
        return;
      }
      viewportResizeStateRef.current = null;
      setIsViewportResizing(false);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, [onCanvasViewportWidthPxChange]);

  const startViewportResize = (clientX: number) => {
    viewportResizeStateRef.current = {
      startX: clientX,
      startWidthPx: viewportLogicalWidthPx,
      startAutoFitScale: autoFitScale,
    };
    setIsViewportResizing(true);
  };

  const breakpointOptions: readonly (Breakpoint | null)[] = [
    null,
    ...BREAKPOINTS,
  ];

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden border-y border-border/70 bg-background/40",
        isViewportResizing && "select-none",
      )}
    >
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-muted/10 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase sm:inline">
            Viewport
          </span>
          <div
            aria-label="Breakpoint"
            className="inline-flex items-center gap-0.5 rounded-md border border-border/70 bg-background p-0.5"
            role="radiogroup"
          >
            {breakpointOptions.map((option) => {
              const key = option ?? "base";
              const active = (option ?? null) === (activeBreakpoint ?? null);
              return (
                <button
                  aria-checked={active}
                  className={cn(
                    "inline-flex h-7 items-center justify-center rounded-sm px-2 text-[11px] font-medium",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent/50",
                  )}
                  key={key}
                  onClick={() => onActiveBreakpointChange(option)}
                  role="radio"
                  title={
                    option
                      ? `${BREAKPOINT_SWITCHER_LABELS[option]} (${BREAKPOINT_MIN_WIDTH_PX[option]}px)`
                      : BREAKPOINT_SWITCHER_LABELS.base
                  }
                  type="button"
                >
                  {BREAKPOINT_SWITCHER_LABELS[key]}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <CanvasViewportControlPopover
            onViewportFontSizeChange={onCanvasFontSizePxChange}
            onViewportWidthChange={(widthPx) => {
              onCanvasViewportWidthPxChange(
                normalizeCanvasViewportWidthPx(widthPx),
              );
            }}
            onViewportZoomChange={onCanvasZoomPercentChange}
            viewportFontSizePx={normalizedFontSizePx}
            viewportWidthPx={viewportLogicalWidthPx}
            viewportZoomPercent={normalizedZoomPercent}
          />
          <Button
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            onClick={onToggleTheme}
            size="icon-sm"
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
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-background dark:bg-card/30">
        <CanvasDropRoot
          composition={composition}
          onBackgroundPointer={() => {
            onCanvasBackground?.();
          }}
          onSelectNode={onSelectNode}
        >
          <div className="flex w-full justify-center" ref={viewportBoundsRef}>
            <div
              className="relative mx-auto shrink-0"
              style={{ width: `${viewportRenderedWidthPx}px` }}
            >
              <div
                className="text-foreground"
                data-testid="studio-canvas-preview"
                style={
                  {
                    width: `${zoomAdjustedViewportWidthPx}px`,
                    zoom: combinedCanvasScale,
                    fontSize: `${normalizedFontSizePx}px`,
                  } as CSSProperties
                }
              >
                {tree}
              </div>
              <button
                aria-label="Resize canvas viewport width"
                className={cn(
                  "absolute top-0 right-0 hidden h-full w-4 translate-x-1/2 cursor-ew-resize items-center justify-center md:flex",
                  isViewportResizing
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  startViewportResize(event.clientX);
                }}
                title="Drag to resize viewport width"
                type="button"
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-14 w-px bg-border/80 transition-colors",
                    isViewportResizing && "bg-primary",
                  )}
                />
              </button>
            </div>
          </div>
        </CanvasDropRoot>
      </div>
    </div>
  );
}
