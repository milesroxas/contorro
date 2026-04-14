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
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { StudioAuthoringClient } from "@repo/contracts-zod";

import { BuilderPanel } from "../components/builder-panel.js";
import { StudioRoot } from "../components/studio-root.js";
import { Separator } from "../components/ui/separator.js";
import { BuilderCanvas } from "../features/canvas/BuilderCanvas.js";
import type { InsertDropData } from "../features/dnd/InsertionDropZone.js";
import { DraftSaveBar } from "../features/draft-save/DraftSaveBar.js";
import { NodeTree } from "../features/node-tree/NodeTree.js";
import { LibraryComponentCatalog } from "../features/primitive-catalog/LibraryComponentCatalog.js";
import { PrimitiveCatalog } from "../features/primitive-catalog/PrimitiveCatalog.js";
import { PropertyInspector } from "../features/property-inspector/PropertyInspector.js";
import { KeyboardShortcutsDrawer } from "../features/shortcuts/KeyboardShortcutsDrawer.js";
import { cn } from "../lib/cn.js";
import { computeInsertIndex } from "../lib/compute-insert-index.js";
import {
  LEFT_SIDEBAR_PANELS,
  type LeftSidebarPanelId,
  resolveLeftSidebarPanelShortcut,
} from "../lib/left-sidebar-panels.js";
import { getPrimitiveDisplay } from "../lib/primitive-display.js";
import { createBuilderStore } from "../model/builder-store.js";

function runtimeCssVariables(cssVariables: string): string {
  const trimmed = cssVariables.trim();
  if (trimmed.length === 0) {
    return "";
  }
  // Builder runtime cannot consume Tailwind's @theme directive directly.
  // Convert each @theme block to :root.
  const withRuntimeTheme = cssVariables.replace(
    /@theme\s*\{([\s\S]*?)\}/g,
    (_match, body) => `:root {${body}\n}`,
  );
  // Scope dark-mode token override to builder-only state so parent admin `.dark`
  // does not force canvas tokens into dark mode.
  return withRuntimeTheme.replace(
    /(^|\n)\s*\.dark\s*\{/g,
    '$1[data-builder-theme="dark"] {',
  );
}

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCenter(args);
};

type ResizeSide = "left" | "right";

const MIN_LEFT_PANEL_WIDTH = 240;
const MAX_LEFT_PANEL_WIDTH = 520;
const MIN_RIGHT_PANEL_WIDTH = 300;
const MAX_RIGHT_PANEL_WIDTH = 640;
const MIN_CENTER_WIDTH = 420;
function BuilderDragPreview({
  activeNodeId,
  activePaletteKey,
  display,
  paletteSubtitle,
}: {
  display: ReturnType<typeof getPrimitiveDisplay>;
  activePaletteKey: string | null;
  activeNodeId: string | null;
  paletteSubtitle: string | null;
}) {
  const { Icon, label } = display;
  return (
    <div className="pointer-events-none flex min-w-[150px] max-w-[min(100vw-2rem,240px)] items-center gap-2 rounded-sm border-2 border-primary/50 bg-card px-2.5 py-1.5 text-card-foreground shadow-xl ring-2 ring-primary/20">
      <Icon
        aria-hidden
        className="size-6 shrink-0 text-primary"
        stroke={1.25}
      />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold capitalize">{label}</div>
        {activePaletteKey ? (
          <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">
            {paletteSubtitle ?? "Add to layout"}
          </div>
        ) : activeNodeId ? (
          <div className="mt-0.5 truncate font-mono text-[11px] leading-tight text-muted-foreground">
            {activeNodeId}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BuilderApp({
  compositionId,
  adminHref,
  canEditName,
  authoringClient,
}: {
  compositionId: string;
  adminHref: string;
  canEditName: boolean;
  /** Injected transport (e.g. fetch to your host). Defaults inside the store when omitted. */
  authoringClient?: StudioAuthoringClient;
}) {
  const useBuilder = useMemo(
    () => createBuilderStore(compositionId, { client: authoringClient }),
    [compositionId, authoringClient],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activePaletteKey, setActivePaletteKey] = useState<string | null>(null);
  const [paletteSubtitle, setPaletteSubtitle] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [activeLeftSidebarPanel, setActiveLeftSidebarPanel] =
    useState<LeftSidebarPanelId>("primitives");
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(360);
  const [isResizingPanels, setIsResizingPanels] = useState(false);
  const layoutRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<{
    side: ResizeSide;
    startX: number;
    leftWidth: number;
    rightWidth: number;
  } | null>(null);

  const composition = useBuilder((s) => s.composition);
  const tokenMetadata = useBuilder((s) => s.tokenMetadata);
  const cssVariables = useBuilder((s) => s.cssVariables);
  const runtimeTokenCss = useMemo(
    () => runtimeCssVariables(cssVariables),
    [cssVariables],
  );
  const name = useBuilder((s) => s.name);
  const selectedNodeId = useBuilder((s) => s.selectedNodeId);
  const dirty = useBuilder((s) => s.dirty);
  const saving = useBuilder((s) => s.saving);
  const renaming = useBuilder((s) => s.renaming);
  const canUndo = useBuilder((s) => s.canUndo);
  const canRedo = useBuilder((s) => s.canRedo);
  const error = useBuilder((s) => s.error);
  const selectNode = useBuilder((s) => s.selectNode);
  const addPrimitive = useBuilder((s) => s.addPrimitive);
  const moveNode = useBuilder((s) => s.moveNode);
  const setTextContent = useBuilder((s) => s.setTextContent);
  const patchNodeProps = useBuilder((s) => s.patchNodeProps);
  const setNodeStyleEntry = useBuilder((s) => s.setNodeStyleEntry);
  const storeResetNodePropKey = useBuilder((s) => s.resetNodePropKey);
  const storeClearNodeStyles = useBuilder((s) => s.clearNodeStyles);
  const setNodeEditorFieldBinding = useBuilder(
    (s) => s.setNodeEditorFieldBinding,
  );
  const saveDraft = useBuilder((s) => s.saveDraft);
  const publish = useBuilder((s) => s.publish);
  const rename = useBuilder((s) => s.rename);
  const undo = useBuilder((s) => s.undo);
  const redo = useBuilder((s) => s.redo);
  const removeNode = useBuilder((s) => s.removeNode);

  useEffect(() => {
    void useBuilder.getState().load();
  }, [useBuilder]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedTheme = window.localStorage.getItem("builder-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme);
      return;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      if (!event.metaKey && !event.ctrlKey && !event.altKey) {
        if (event.key === "Delete" || event.key === "Backspace") {
          if (selectedNodeId) {
            event.preventDefault();
            removeNode(selectedNodeId);
          }
          return;
        }
        const panel = resolveLeftSidebarPanelShortcut(event.key);
        if (panel) {
          event.preventDefault();
          setActiveLeftSidebarPanel(panel);
          return;
        }
      }
      const key = event.key.toLowerCase();
      const hasModifier = event.metaKey || event.ctrlKey;
      if (!hasModifier) {
        return;
      }
      if (key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
          return;
        }
        undo();
        return;
      }
      if (key === "y" && event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [redo, undo, removeNode, selectedNodeId]);

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
      setPaletteSubtitle(
        typeof d.displayName === "string" ? d.displayName : null,
      );
      setActiveNodeId(null);
      return;
    }
    if (d?.kind === "node" && typeof d.nodeId === "string") {
      setActiveNodeId(d.nodeId);
      setActivePaletteKey(null);
      setPaletteSubtitle(null);
      return;
    }
    setActivePaletteKey(null);
    setPaletteSubtitle(null);
    setActiveNodeId(null);
  };

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
  const onDragEnd = (event: DragEndEvent) => {
    setActivePaletteKey(null);
    setPaletteSubtitle(null);
    setActiveNodeId(null);
    if (!composition) {
      return;
    }
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
      const idx = computeInsertIndex(
        composition,
        parentId,
        insertIndex,
        nodeId,
      );
      moveNode(nodeId, parentId, idx);
    }
  };

  const onDragCancel = () => {
    setActivePaletteKey(null);
    setPaletteSubtitle(null);
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
  }, [composition, removeNode, selectNode, selectedNodeId]);

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
        data-builder-theme={theme}
        data-testid="builder-app"
      >
        <DraftSaveBar
          canEditName={canEditName}
          canRedo={canRedo}
          canUndo={canUndo}
          dirty={dirty}
          error={error}
          name={name}
          onPublish={() => void publish()}
          onRedo={() => redo()}
          onRename={async (nextName) => {
            await rename(nextName);
          }}
          onSaveDraft={() => void saveDraft()}
          onUndo={() => undo()}
          renaming={renaming}
          saving={saving}
          adminHref={adminHref}
        />
        <div
          className={cn(
            "grid min-h-0 min-w-0 flex-1 grid-cols-1 auto-rows-fr gap-3 overflow-hidden lg:auto-rows-auto lg:grid-cols-[minmax(240px,var(--builder-left-panel-width))_6px_minmax(0,1fr)_6px_minmax(300px,var(--builder-right-panel-width))] lg:grid-rows-1",
            isResizingPanels && "select-none",
          )}
          ref={layoutRef}
          style={
            {
              "--builder-left-panel-width": `${leftPanelWidth}px`,
              "--builder-right-panel-width": `${rightPanelWidth}px`,
            } as CSSProperties
          }
        >
          <div className="flex min-h-0 min-w-0 overflow-hidden">
            <nav
              aria-label="Left builder panels"
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
                <KeyboardShortcutsDrawer />
              </div>
            </nav>
            <BuilderPanel
              className="min-h-0 min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none"
              collapsible={false}
              contentClassName="flex-1"
              title={leftSidebarPanel.label}
            >
              {leftSidebarPanel.content}
            </BuilderPanel>
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
            <BuilderCanvas
              composition={composition}
              onCanvasBackground={() => selectNode(null)}
              onRemoveNode={removeNode}
              onSelectNode={selectNode}
              onToggleTheme={() => {
                setTheme((prevTheme) => {
                  const nextTheme = prevTheme === "dark" ? "light" : "dark";
                  window.localStorage.setItem("builder-theme", nextTheme);
                  return nextTheme;
                });
              }}
              selectedNodeId={selectedNodeId}
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
          <BuilderPanel
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
              composition={composition}
              node={selectedNode}
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
            />
          </BuilderPanel>
        </div>
      </StudioRoot>
      <DragOverlay dropAnimation={null}>
        {overlayDisplay ? (
          <BuilderDragPreview
            activeNodeId={activeNodeId}
            activePaletteKey={activePaletteKey}
            display={overlayDisplay}
            paletteSubtitle={paletteSubtitle}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
