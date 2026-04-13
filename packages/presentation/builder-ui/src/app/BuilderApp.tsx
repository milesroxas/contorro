"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";

import { BuilderPanel } from "../components/builder-panel.js";
import { ScrollArea } from "../components/scroll-area.js";
import { BuilderCanvas } from "../features/canvas/BuilderCanvas.js";
import type { InsertDropData } from "../features/dnd/InsertionDropZone.js";
import { DraftSaveBar } from "../features/draft-save/DraftSaveBar.js";
import { NodeTree } from "../features/node-tree/NodeTree.js";
import { LibraryComponentCatalog } from "../features/primitive-catalog/LibraryComponentCatalog.js";
import { PrimitiveCatalog } from "../features/primitive-catalog/PrimitiveCatalog.js";
import { PropertyInspector } from "../features/property-inspector/PropertyInspector.js";
import { cn } from "../lib/cn.js";
import { computeInsertIndex } from "../lib/compute-insert-index.js";
import { getPrimitiveDisplay } from "../lib/primitive-display.js";
import { createBuilderStore } from "../model/builder-store.js";

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
    <div className="pointer-events-none flex min-w-[220px] max-w-[min(100vw-2rem,320px)] items-center gap-3 rounded-lg border-2 border-primary/50 bg-card px-4 py-3 text-card-foreground shadow-2xl ring-2 ring-primary/20">
      <Icon
        aria-hidden
        className="size-9 shrink-0 text-primary"
        stroke={1.25}
      />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold capitalize">{label}</div>
        {activePaletteKey ? (
          <div className="mt-0.5 text-xs text-muted-foreground">
            {paletteSubtitle ?? "Add to layout"}
          </div>
        ) : activeNodeId ? (
          <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
            {activeNodeId}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function BuilderApp({
  compositionId,
  studioHref,
  canEditName,
}: {
  compositionId: string;
  studioHref: string;
  canEditName: boolean;
}) {
  const useBuilder = useMemo(
    () => createBuilderStore(compositionId),
    [compositionId],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const [activePaletteKey, setActivePaletteKey] = useState<string | null>(null);
  const [paletteSubtitle, setPaletteSubtitle] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const composition = useBuilder((s) => s.composition);
  const tokenMetadata = useBuilder((s) => s.tokenMetadata);
  const cssVariables = useBuilder((s) => s.cssVariables);
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
  const setNodeStyleToken = useBuilder((s) => s.setNodeStyleToken);
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
  }, [redo, undo]);

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

  if (!composition) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 text-sm text-muted-foreground">
        {error ?? "Loading…"}
      </div>
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

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
        )}
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
          studioHref={studioHref}
        />
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 auto-rows-[minmax(0,1fr)] gap-3 p-3 lg:auto-rows-auto lg:grid-cols-[minmax(0,220px)_1fr_minmax(0,280px)] lg:grid-rows-1">
          <div className="flex min-h-0 min-w-0 flex-col gap-3">
            <BuilderPanel title="Primitives">
              <PrimitiveCatalog embedded />
            </BuilderPanel>
            <BuilderPanel title="Library">
              <LibraryComponentCatalog embedded />
            </BuilderPanel>
            <BuilderPanel className="flex-[1.25_1_0%]" title="Layers">
              <NodeTree
                composition={composition}
                embedded
                onRemoveNode={removeNode}
                onSelect={selectNode}
                selectedNodeId={selectedNodeId}
              />
            </BuilderPanel>
          </div>
          <div className="flex min-h-0 min-w-0 flex-col">
            {cssVariables ? <style>{cssVariables}</style> : null}
            <BuilderCanvas
              composition={composition}
              onCanvasBackground={() => selectNode(null)}
              onRemoveNode={removeNode}
              onSelectNode={selectNode}
              selectedNodeId={selectedNodeId}
              tokenMeta={tokenMetadata}
            />
          </div>
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-md border border-border bg-muted/20 dark:bg-muted/10">
            <div className="shrink-0 border-b border-border/70 px-3 py-2.5 text-xs font-medium text-muted-foreground">
              Inspector
            </div>
            <ScrollArea className="min-h-0 min-w-0 flex-1">
              <div className="p-3 pr-2">
                <PropertyInspector
                  composition={composition}
                  node={selectedNode}
                  onNodeStyleToken={(property, token) => {
                    if (selectedNodeId) {
                      setNodeStyleToken(selectedNodeId, property, token);
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
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
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
