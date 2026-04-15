"use client";

import {
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  PageComposition,
  StudioAuthoringClient,
} from "@repo/contracts-zod";
import { StudioPanel } from "../components/studio-panel.js";
import { StudioRoot } from "../components/studio-root.js";
import { Card, CardContent } from "../components/ui/card.js";
import { Separator } from "../components/ui/separator.js";
import { StudioCanvas } from "../features/canvas/StudioCanvas.js";
import type { InsertDropData } from "../features/dnd/InsertionDropZone.js";
import { DraftSaveBar } from "../features/draft-save/DraftSaveBar.js";
import { NodeTree } from "../features/node-tree/NodeTree.js";
import { LibraryComponentCatalog } from "../features/primitive-catalog/LibraryComponentCatalog.js";
import { PrimitiveCatalog } from "../features/primitive-catalog/PrimitiveCatalog.js";
import { PropertyInspector } from "../features/property-inspector/PropertyInspector.js";
import { KeyboardShortcutsDrawer } from "../features/shortcuts/KeyboardShortcutsDrawer.js";
import { StudioUnsavedChangesGuard } from "../features/unsaved-changes/StudioUnsavedChangesGuard.js";
import { cn } from "../lib/cn.js";
import { computeInsertIndex } from "../lib/compute-insert-index.js";
import {
  type StudioInspectorTab,
  resolveInspectorTabShortcut,
} from "../lib/inspector-tab-shortcuts.js";
import {
  LEFT_SIDEBAR_PANELS,
  type LeftSidebarPanelId,
  resolveLeftSidebarPanelShortcut,
} from "../lib/left-sidebar-panels.js";
import { getPrimitiveDisplay } from "../lib/primitive-display.js";
import { createStudioStore } from "../model/studio-store.js";

function runtimeCssVariables(cssVariables: string): string {
  const trimmed = cssVariables.trim();
  if (trimmed.length === 0) {
    return "";
  }
  // Studio runtime cannot consume Tailwind's @theme directive directly.
  // Convert each @theme block to :root.
  const withRuntimeTheme = cssVariables.replace(
    /@theme\s*\{([\s\S]*?)\}/g,
    (_match, body) => `:root {${body}\n}`,
  );
  // Scope dark-mode token override to Studio-only state so parent admin `.dark`
  // does not force canvas tokens into dark mode.
  return withRuntimeTheme.replace(
    /(^|\n)\s*\.dark\s*\{/g,
    '$1[data-studio-theme="dark"] {',
  );
}

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    if (pointerCollisions.length === 1) {
      return pointerCollisions;
    }
    // Nested canvas insert strips often sit inside wider ancestors; prefer the
    // smallest rect under the pointer so inner boxes win over outer drop lines.
    const scored = pointerCollisions.map((collision) => {
      const rect = args.droppableRects.get(collision.id);
      const area =
        rect && rect.width > 0 && rect.height > 0
          ? rect.width * rect.height
          : Number.POSITIVE_INFINITY;
      return { collision, area };
    });
    scored.sort((a, b) => a.area - b.area);
    return [scored[0].collision];
  }
  return closestCenter(args);
};

type ResizeSide = "left" | "right";

const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 520;
const MIN_RIGHT_PANEL_WIDTH = 300;
const MAX_RIGHT_PANEL_WIDTH = 640;
const MIN_CENTER_WIDTH = 420;

function isStudioGlobalKeyTargetIgnored(target: EventTarget | null): boolean {
  if (target === null) {
    return true;
  }
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function studioHandleModifierUndoRedo(
  event: KeyboardEvent,
  actions: { undo: () => void; redo: () => void },
): void {
  const key = event.key.toLowerCase();
  if (!(event.metaKey || event.ctrlKey)) {
    return;
  }
  if (key === "z") {
    event.preventDefault();
    if (event.shiftKey) {
      actions.redo();
    } else {
      actions.undo();
    }
    return;
  }
  if (key === "y" && event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    actions.redo();
  }
}

type StudioPlainGlobalKeyActions = {
  selectedNodeId: string | null;
  removeNode: (id: string) => void;
  setActiveLeftSidebarPanel: (id: LeftSidebarPanelId) => void;
  setActiveInspectorTab: (tab: StudioInspectorTab) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
};

function studioHandlePlainGlobalKeys(
  event: KeyboardEvent,
  actions: StudioPlainGlobalKeyActions,
): void {
  if (event.metaKey || event.ctrlKey || event.altKey) {
    return;
  }
  if (event.key === "`" && !event.shiftKey) {
    event.preventDefault();
    actions.setKeyboardShortcutsOpen(true);
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    if (actions.selectedNodeId) {
      event.preventDefault();
      actions.removeNode(actions.selectedNodeId);
    }
    return;
  }
  const panel = resolveLeftSidebarPanelShortcut(event.key);
  if (panel) {
    event.preventDefault();
    actions.setActiveLeftSidebarPanel(panel);
    return;
  }
  const inspectorTab = resolveInspectorTabShortcut(event.key);
  if (inspectorTab) {
    event.preventDefault();
    actions.setActiveInspectorTab(inspectorTab);
  }
}

function handleStudioGlobalKeyDown(
  event: KeyboardEvent,
  actions: StudioPlainGlobalKeyActions & { undo: () => void; redo: () => void },
): void {
  if (isStudioGlobalKeyTargetIgnored(event.target)) {
    return;
  }
  studioHandlePlainGlobalKeys(event, actions);
  studioHandleModifierUndoRedo(event, actions);
}

function applyStudioDragEndMutation(
  event: DragEndEvent,
  composition: PageComposition,
  addPrimitive: (
    parentId: string,
    definitionKey: string,
    idx: number,
    libKey: string | undefined,
  ) => void,
  moveNode: (nodeId: string, parentId: string, idx: number) => void,
): void {
  const { active, over } = event;
  if (!over) {
    return;
  }
  const overData = over.data.current as InsertDropData | undefined;
  if (overData?.kind !== "insert") {
    return;
  }
  const { parentId, insertIndex } = overData;
  const activeData = active.data.current;
  if (
    activeData?.kind === "palette" &&
    typeof activeData.definitionKey === "string"
  ) {
    const idx = computeInsertIndex(composition, parentId, insertIndex, null);
    const libKey =
      activeData.definitionKey === "primitive.libraryComponent" &&
      typeof activeData.libraryComponentKey === "string"
        ? activeData.libraryComponentKey
        : undefined;
    addPrimitive(parentId, activeData.definitionKey, idx, libKey);
    return;
  }
  if (activeData?.kind === "node" && typeof activeData.nodeId === "string") {
    const nodeId = activeData.nodeId;
    if (nodeId === composition.rootId) {
      return;
    }
    const idx = computeInsertIndex(composition, parentId, insertIndex, nodeId);
    moveNode(nodeId, parentId, idx);
  }
}

function StudioDragPreview({
  display,
}: {
  display: ReturnType<typeof getPrimitiveDisplay>;
}) {
  const { Icon, label } = display;
  return (
    <Card size="sm" variant="dragPreview">
      <CardContent>
        <Icon
          aria-hidden
          className="size-4 shrink-0 text-primary"
          stroke={1.6}
        />
        <div className="truncate text-xs font-medium capitalize leading-none">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

export function StudioApp({
  compositionId,
  adminHref,
  dashboardHref,
  componentsHref,
  designSystemHref,
  canEditName,
  authoringClient,
}: {
  compositionId: string;
  adminHref: string;
  dashboardHref: string;
  componentsHref: string;
  designSystemHref: string;
  canEditName: boolean;
  /** Injected transport (e.g. fetch to your host). Defaults inside the store when omitted. */
  authoringClient?: StudioAuthoringClient;
}) {
  const useStudioStore = useMemo(
    () => createStudioStore(compositionId, { client: authoringClient }),
    [compositionId, authoringClient],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activePaletteKey, setActivePaletteKey] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeLeftSidebarPanel, setActiveLeftSidebarPanel] =
    useState<LeftSidebarPanelId>("primitives");
  const [activeInspectorTab, setActiveInspectorTab] =
    useState<StudioInspectorTab>("styles");
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(360);
  const [isResizingPanels, setIsResizingPanels] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<{
    side: ResizeSide;
    startX: number;
    leftWidth: number;
    rightWidth: number;
  } | null>(null);

  const composition = useStudioStore((s) => s.composition);
  const tokenMetadata = useStudioStore((s) => s.tokenMetadata);
  const cssVariables = useStudioStore((s) => s.cssVariables);
  const runtimeTokenCss = useMemo(
    () => runtimeCssVariables(cssVariables),
    [cssVariables],
  );
  const studioResource = useStudioStore((s) => s.studioResource);
  const name = useStudioStore((s) => s.name);
  const selectedNodeId = useStudioStore((s) => s.selectedNodeId);
  const dirty = useStudioStore((s) => s.dirty);
  const saving = useStudioStore((s) => s.saving);
  const renaming = useStudioStore((s) => s.renaming);
  const canUndo = useStudioStore((s) => s.canUndo);
  const canRedo = useStudioStore((s) => s.canRedo);
  const error = useStudioStore((s) => s.error);
  const cmsPublicationStatus = useStudioStore((s) => s.cmsPublicationStatus);
  const selectNode = useStudioStore((s) => s.selectNode);
  const addPrimitive = useStudioStore((s) => s.addPrimitive);
  const moveNode = useStudioStore((s) => s.moveNode);
  const setTextContent = useStudioStore((s) => s.setTextContent);
  const patchNodeProps = useStudioStore((s) => s.patchNodeProps);
  const setNodeStyleEntry = useStudioStore((s) => s.setNodeStyleEntry);
  const storeResetNodePropKey = useStudioStore((s) => s.resetNodePropKey);
  const storeClearNodeStyles = useStudioStore((s) => s.clearNodeStyles);
  const setNodeEditorFieldBinding = useStudioStore(
    (s) => s.setNodeEditorFieldBinding,
  );
  const saveDraft = useStudioStore((s) => s.saveDraft);
  const publish = useStudioStore((s) => s.publish);
  const rename = useStudioStore((s) => s.rename);
  const undo = useStudioStore((s) => s.undo);
  const redo = useStudioStore((s) => s.redo);
  const removeNode = useStudioStore((s) => s.removeNode);

  const trySaveDraft = useCallback(async () => {
    await saveDraft();
    const { error: saveError, dirty: stillDirty } = useStudioStore.getState();
    return saveError === null && !stillDirty;
  }, [saveDraft, useStudioStore]);

  useEffect(() => {
    void useStudioStore.getState().load();
  }, [useStudioStore]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedTheme =
      window.localStorage.getItem("studio-theme") ??
      window.localStorage.getItem("builder-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleStudioGlobalKeyDown(event, {
        redo,
        removeNode,
        selectedNodeId,
        setActiveInspectorTab,
        setActiveLeftSidebarPanel,
        setKeyboardShortcutsOpen,
        undo,
      });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [redo, removeNode, selectedNodeId, undo]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const state = resizeStateRef.current;
      const layout = layoutRef.current;
      if (!state || !layout) {
        return;
      }
      const deltaX = event.clientX - state.startX;
      const availableWidth = layout.getBoundingClientRect().width;
      if (state.side === "left") {
        const maxLeft = Math.min(
          MAX_LEFT_PANEL_WIDTH,
          availableWidth - state.rightWidth - MIN_CENTER_WIDTH,
        );
        const next = Math.max(
          MIN_LEFT_PANEL_WIDTH,
          Math.min(maxLeft, state.leftWidth + deltaX),
        );
        setLeftPanelWidth(next);
        return;
      }

      const maxRight = Math.min(
        MAX_RIGHT_PANEL_WIDTH,
        availableWidth - state.leftWidth - MIN_CENTER_WIDTH,
      );
      const next = Math.max(
        MIN_RIGHT_PANEL_WIDTH,
        Math.min(maxRight, state.rightWidth - deltaX),
      );
      setRightPanelWidth(next);
    };

    const stopResize = () => {
      resizeStateRef.current = null;
      setIsResizingPanels(false);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };
  }, []);

  const startResize = (side: ResizeSide, clientX: number) => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return;
    }
    resizeStateRef.current = {
      side,
      startX: clientX,
      leftWidth: leftPanelWidth,
      rightWidth: rightPanelWidth,
    };
    setIsResizingPanels(true);
  };

  const onDragStart = (event: DragStartEvent) => {
    const d = event.active.data.current;
    if (d?.kind === "palette" && typeof d.definitionKey === "string") {
      setActivePaletteKey(d.definitionKey);
      setActiveNodeId(null);
      return;
    }
    if (d?.kind === "node" && typeof d.nodeId === "string") {
      setActiveNodeId(d.nodeId);
      setActivePaletteKey(null);
      return;
    }
    setActivePaletteKey(null);
    setActiveNodeId(null);
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActivePaletteKey(null);
    setActiveNodeId(null);
    if (!composition) {
      return;
    }
    applyStudioDragEndMutation(event, composition, addPrimitive, moveNode);
  };

  const onDragCancel = () => {
    setActivePaletteKey(null);
    setActiveNodeId(null);
  };

  const leftSidebarPanels = useMemo(() => {
    if (!composition) {
      return [];
    }
    return LEFT_SIDEBAR_PANELS.map((def) => ({
      ...def,
      content: ((): ReactNode => {
        switch (def.id) {
          case "primitives":
            return <PrimitiveCatalog />;
          case "layers":
            return (
              <NodeTree
                composition={composition}
                onRemoveNode={removeNode}
                onSelect={selectNode}
                selectedNodeId={selectedNodeId}
                studioResource={studioResource}
              />
            );
          case "components":
            return <LibraryComponentCatalog />;
          default: {
            const _exhaustive: never = def.id;
            return _exhaustive;
          }
        }
      })(),
    }));
  }, [composition, removeNode, selectNode, selectedNodeId, studioResource]);

  if (!composition) {
    return (
      <StudioRoot className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 text-sm text-muted-foreground">
        {error ?? "Loading…"}
      </StudioRoot>
    );
  }

  const selectedNode = selectedNodeId
    ? (composition.nodes[selectedNodeId] ?? null)
    : null;

  const overlayDefinitionKey =
    activePaletteKey !== null
      ? activePaletteKey
      : activeNodeId
        ? (composition.nodes[activeNodeId]?.definitionKey ?? "primitive.box")
        : null;

  const overlayDisplay = overlayDefinitionKey
    ? getPrimitiveDisplay(overlayDefinitionKey)
    : null;
  const leftSidebarPanel =
    leftSidebarPanels.find(({ id }) => id === activeLeftSidebarPanel) ??
    leftSidebarPanels[0];
  const resourceLabel =
    studioResource === "component" ? "Component" : "Page Template";

  return (
    <DndContext
      collisionDetection={pointerFirstCollisionDetection}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <StudioRoot
        className={cn(
          "flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
          theme === "dark" && "dark",
        )}
        data-studio-theme={theme}
        data-testid="studio-app"
      >
        <DraftSaveBar
          canEditName={canEditName}
          canRedo={canRedo}
          canUndo={canUndo}
          cmsPublicationStatus={cmsPublicationStatus}
          dirty={dirty}
          error={error}
          name={name}
          resourceLabel={resourceLabel}
          onPublish={() => void publish()}
          onRedo={() => redo()}
          onRename={async (nextName) => {
            await rename(nextName);
          }}
          onSaveDraft={() => void saveDraft()}
          onUndo={() => undo()}
          dashboardHref={dashboardHref}
          componentsHref={componentsHref}
          designSystemHref={designSystemHref}
          renaming={renaming}
          saving={saving}
          adminHref={adminHref}
        />
        <StudioUnsavedChangesGuard
          dirty={dirty}
          saving={saving}
          trySaveDraft={trySaveDraft}
        />
        <div
          className={cn(
            "grid min-h-0 min-w-0 flex-1 grid-cols-1 auto-rows-fr gap-3 overflow-hidden lg:auto-rows-auto lg:grid-cols-[minmax(240px,var(--studio-left-panel-width))_6px_minmax(0,1fr)_6px_minmax(300px,var(--studio-right-panel-width))] lg:grid-rows-1",
            isResizingPanels && "select-none",
          )}
          ref={layoutRef}
          style={
            {
              "--studio-left-panel-width": `${leftPanelWidth}px`,
              "--studio-right-panel-width": `${rightPanelWidth}px`,
            } as CSSProperties
          }
        >
          <div className="flex min-h-0 min-w-0 overflow-hidden">
            <nav
              aria-label="Left Studio panels"
              className="flex shrink-0 flex-col items-center gap-1 border-r border-border/70 bg-muted/20 p-1.5 dark:bg-muted/10"
            >
              <div className="flex w-full flex-col items-center gap-1">
                {leftSidebarPanels.map(({ id, label, Icon, shortcutDigit }) => {
                  const isActive = activeLeftSidebarPanel === id;
                  return (
                    <button
                      aria-keyshortcuts={shortcutDigit}
                      aria-label={label}
                      aria-pressed={isActive}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors",
                        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        isActive &&
                          "border-border bg-background text-foreground shadow-sm",
                      )}
                      key={id}
                      onClick={() => setActiveLeftSidebarPanel(id)}
                      title={`${label} (${shortcutDigit})`}
                      type="button"
                    >
                      <Icon aria-hidden className="size-5.5" stroke={1.7} />
                    </button>
                  );
                })}
              </div>
              <div className="mt-auto flex w-full flex-col items-center gap-2 pt-2">
                <Separator className="w-8 bg-border/70" />
                <KeyboardShortcutsDrawer
                  onOpenChange={setKeyboardShortcutsOpen}
                  open={keyboardShortcutsOpen}
                />
              </div>
            </nav>
            <StudioPanel
              className="min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none"
              collapsible={false}
              contentClassName="flex-1"
              title={leftSidebarPanel.label}
            >
              {leftSidebarPanel.content}
            </StudioPanel>
          </div>
          <button
            aria-label="Resize left panel"
            className="group hidden cursor-col-resize items-center justify-center rounded-sm bg-transparent lg:flex"
            onPointerDown={(event) => {
              event.preventDefault();
              startResize("left", event.clientX);
            }}
            type="button"
          >
            <div className="h-full w-px bg-border/75 transition-colors group-hover:bg-primary/60" />
          </button>
          <div className="flex min-h-0 min-w-0 flex-col">
            {runtimeTokenCss ? <style>{runtimeTokenCss}</style> : null}
            <StudioCanvas
              composition={composition}
              onCanvasBackground={() => selectNode(null)}
              onRemoveNode={removeNode}
              onSelectNode={(nodeId) => {
                if (activeLeftSidebarPanel !== "layers") {
                  setActiveLeftSidebarPanel("layers");
                }
                selectNode(nodeId);
              }}
              onToggleTheme={() => {
                setTheme((prevTheme) => {
                  const nextTheme = prevTheme === "dark" ? "light" : "dark";
                  window.localStorage.setItem("studio-theme", nextTheme);
                  return nextTheme;
                });
              }}
              selectedNodeId={selectedNodeId}
              studioResource={studioResource}
              theme={theme}
              tokenMeta={tokenMetadata}
            />
          </div>
          <button
            aria-label="Resize inspector panel"
            className="group hidden cursor-col-resize items-center justify-center rounded-sm bg-transparent lg:flex"
            onPointerDown={(event) => {
              event.preventDefault();
              startResize("right", event.clientX);
            }}
            type="button"
          >
            <div className="h-full w-px bg-border/75 transition-colors group-hover:bg-primary/60" />
          </button>
          <StudioPanel
            className="min-h-0 min-w-0 rounded-none border-0 bg-transparent shadow-none [&>div:first-child]:hidden"
            collapsible={false}
            contentClassName="flex-1"
            title=""
          >
            <PropertyInspector
              clearNodeStyles={() => {
                if (selectedNodeId) {
                  storeClearNodeStyles(selectedNodeId);
                }
              }}
              componentsHref={componentsHref}
              composition={composition}
              inspectorTab={activeInspectorTab}
              node={selectedNode}
              onInspectorTabChange={setActiveInspectorTab}
              resetNodePropKey={(propKey) => {
                if (selectedNodeId) {
                  storeResetNodePropKey(selectedNodeId, propKey);
                }
              }}
              tokenMetadata={tokenMetadata}
              onNodeStyleEntry={(property, entry) => {
                if (selectedNodeId) {
                  setNodeStyleEntry(selectedNodeId, property, entry);
                }
              }}
              onTextChange={(c) => {
                if (selectedNodeId) {
                  setTextContent(selectedNodeId, c);
                }
              }}
              patchNodeProps={(patch) => {
                if (selectedNodeId) {
                  patchNodeProps(selectedNodeId, patch);
                }
              }}
              setNodeEditorFieldBinding={(field) => {
                if (selectedNodeId) {
                  setNodeEditorFieldBinding(selectedNodeId, field);
                }
              }}
              studioResource={studioResource}
            />
          </StudioPanel>
        </div>
      </StudioRoot>
      <DragOverlay
        adjustScale={false}
        dropAnimation={null}
        modifiers={[snapCenterToCursor]}
      >
        {overlayDisplay ? <StudioDragPreview display={overlayDisplay} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
