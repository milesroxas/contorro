"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import type {
  Breakpoint,
  CompositionNode,
  EditorFieldSpec,
  PageComposition,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconDeviceFloppy,
  IconRocket,
} from "@tabler/icons-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "../../components/ui/button.js";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "../../components/ui/drawer.js";
import { Separator } from "../../components/ui/separator.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.js";
import { StudioCanvas } from "../../features/canvas/StudioCanvas.js";
import { NodeTree } from "../../features/node-tree/NodeTree.js";
import { PageTemplatesPanel } from "../../features/page-templates/PageTemplatesPanel.js";
import type { PageTemplateListFilter } from "../../features/page-templates/page-template-list-filter.js";
import { PageTemplateListFilterSelect } from "../../features/page-templates/page-template-list-filter.js";
import { LibraryComponentCatalog } from "../../features/primitive-catalog/LibraryComponentCatalog.js";
import { PrimitiveCatalog } from "../../features/primitive-catalog/PrimitiveCatalog.js";
import { PropertyInspector } from "../../features/property-inspector/PropertyInspector.js";
import { cn } from "../../lib/cn.js";
import type { StudioInspectorTab } from "../../lib/inspector-tab-shortcuts.js";
import type { LeftSidebarPanelId } from "../../lib/left-sidebar-panels.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import {
  MOBILE_STORAGE_KEYS,
  readMobilePref,
  writeMobilePref,
} from "../../lib/studio-mobile-storage.js";
import type { StagedTapInsertion } from "../../lib/tap-insertion-context.js";
import {
  STUDIO_NAV_ITEMS,
  type StudioTopLevelScreen,
} from "../../shell/studio-navigation.js";
import { MobileStagingHud } from "./MobileStagingHud.js";
import { MobileStudioDock } from "./MobileStudioDock.js";
import type {
  MobileAddCatalog,
  MobileLayersTab,
  MobileSheetId,
} from "./mobile-studio-types.js";

function readSheetPref(key: string, fallback: string): string {
  const stored = readMobilePref(key);
  return stored ?? fallback;
}

function stagedInsertionDisplayLabel(
  staged: StagedTapInsertion | null,
): string {
  if (!staged) {
    return "";
  }
  if (
    staged.definitionKey === "primitive.libraryComponent" &&
    staged.libraryComponentKey
  ) {
    return staged.libraryComponentKey;
  }
  return getPrimitiveDisplay(staged.definitionKey).label;
}

export function MobileStudioLayout({
  activeBreakpoint,
  activeInspectorTab,
  canvasFontSizePx,
  canvasViewportWidthPx,
  canvasZoomPercent,
  clearNodeStyles,
  composition,
  componentsHref,
  compositionId,
  onActiveBreakpointChange,
  onCanvasFontSizePxChange,
  onCanvasViewportWidthPxChange,
  onCanvasZoomPercentChange,
  onInspectorTabChange,
  onLeftSidebarPanelChange,
  onNodeStyleEntry,
  onPublish,
  onRedo,
  onRemoveNode,
  onSaveDraft,
  onSelectNode,
  onTextChange,
  onToggleTheme,
  onUndo,
  onWrapNode,
  pageTemplateListFilter,
  onPageTemplateListFilterChange,
  patchNodeProps,
  resetNodePropKey,
  selectedNode,
  selectedNodeId,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
  stagedTapInsertion,
  onCancelStagedTapInsertion,
  studioResource,
  theme,
  tokenMetadata,
  canUndo,
  canRedo,
  saving,
  dirty,
}: {
  activeBreakpoint: Breakpoint | null;
  activeInspectorTab: StudioInspectorTab;
  canvasFontSizePx: number;
  canvasViewportWidthPx: number;
  canvasZoomPercent: number;
  clearNodeStyles: () => void;
  composition: PageComposition;
  componentsHref: string;
  compositionId: string;
  onActiveBreakpointChange: (breakpoint: Breakpoint | null) => void;
  onCanvasFontSizePxChange: (fontSizePx: number) => void;
  onCanvasViewportWidthPxChange: (widthPx: number) => void;
  onCanvasZoomPercentChange: (zoomPercent: number) => void;
  onInspectorTabChange: (tab: StudioInspectorTab) => void;
  onLeftSidebarPanelChange: (id: LeftSidebarPanelId) => void;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  onPublish: () => void;
  onRedo: () => void;
  onRemoveNode: (id: string) => void;
  onSaveDraft: () => void;
  onSelectNode: (id: string | null) => void;
  onTextChange: (content: string) => void;
  onToggleTheme: () => void;
  onUndo: () => void;
  onWrapNode: (id: string) => void;
  pageTemplateListFilter: PageTemplateListFilter;
  onPageTemplateListFilterChange: (value: PageTemplateListFilter) => void;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  selectedNode: CompositionNode | null;
  selectedNodeId: string | null;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
  stagedTapInsertion: StagedTapInsertion | null;
  onCancelStagedTapInsertion: () => void;
  studioResource: "pageTemplate" | "component" | null;
  theme: "light" | "dark";
  tokenMetadata: TokenMeta[];
  canUndo: boolean;
  canRedo: boolean;
  saving: boolean;
  dirty: boolean;
}) {
  const [activeSheet, setActiveSheet] = useState<MobileSheetId | null>(null);
  const [addCatalog, setAddCatalog] = useState<MobileAddCatalog>(() =>
    readSheetPref(MOBILE_STORAGE_KEYS.addCatalog, "primitives") === "components"
      ? "components"
      : "primitives",
  );
  const [layersTab, setLayersTab] = useState<MobileLayersTab>(() =>
    readSheetPref(MOBILE_STORAGE_KEYS.layersTab, "layers") === "pageTemplates"
      ? "pageTemplates"
      : "layers",
  );

  useEffect(() => {
    writeMobilePref(MOBILE_STORAGE_KEYS.addCatalog, addCatalog);
  }, [addCatalog]);
  useEffect(() => {
    writeMobilePref(MOBILE_STORAGE_KEYS.layersTab, layersTab);
  }, [layersTab]);

  // When a node is selected (via canvas or layers), pop the inspector sheet
  // only if the user explicitly taps a node while no sheet is open. We don't
  // auto-open on every selection change to avoid hijacking the canvas.
  const selectFromSheet = useCallback(
    (nodeId: string | null) => {
      onSelectNode(nodeId);
    },
    [onSelectNode],
  );

  // Close the dock sheet as soon as the user arms a palette item so the
  // canvas and drop zones are immediately reachable.
  useEffect(() => {
    if (stagedTapInsertion !== null && activeSheet === "add") {
      setActiveSheet(null);
    }
  }, [stagedTapInsertion, activeSheet]);

  // After a tap-to-insert completes (staged cleared), reopen the inspector so
  // the user can style the freshly-placed element right away.
  const previousStagedRef = usePreviousStaging(stagedTapInsertion);
  useEffect(() => {
    if (
      previousStagedRef !== null &&
      stagedTapInsertion === null &&
      selectedNodeId !== null &&
      activeSheet === null
    ) {
      setActiveSheet("inspect");
    }
  }, [activeSheet, previousStagedRef, selectedNodeId, stagedTapInsertion]);

  const sheetTitle: Record<MobileSheetId, string> = {
    add: "Add element",
    inspect: "Inspect",
    layers: "Layers",
    menu: "Studio menu",
  };
  const activeNavScreen: StudioTopLevelScreen | null =
    studioResource === "component"
      ? "components"
      : studioResource === "pageTemplate"
        ? "templates"
        : null;

  const closeSheet = () => setActiveSheet(null);

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <StudioCanvas
          activeBreakpoint={activeBreakpoint}
          canvasFontSizePx={canvasFontSizePx}
          canvasViewportWidthPx={canvasViewportWidthPx}
          canvasZoomPercent={canvasZoomPercent}
          composition={composition}
          onActiveBreakpointChange={onActiveBreakpointChange}
          onCanvasFontSizePxChange={onCanvasFontSizePxChange}
          onCanvasBackground={() => onSelectNode(null)}
          onCanvasViewportWidthPxChange={onCanvasViewportWidthPxChange}
          onCanvasZoomPercentChange={onCanvasZoomPercentChange}
          onRemoveNode={onRemoveNode}
          onSelectNode={(nodeId) => {
            onSelectNode(nodeId);
            onLeftSidebarPanelChange("layers");
          }}
          onToggleTheme={onToggleTheme}
          onWrapNode={onWrapNode}
          selectedNodeId={selectedNodeId}
          studioResource={studioResource}
          theme={theme}
          tokenMeta={tokenMetadata}
        />
        {stagedTapInsertion ? (
          <MobileStagingHud
            label={stagedInsertionDisplayLabel(stagedTapInsertion)}
            onCancel={onCancelStagedTapInsertion}
          />
        ) : null}
      </div>

      <MobileStudioDock
        activeSheet={activeSheet}
        hasSelection={selectedNodeId !== null}
        onSelect={(id) => {
          setActiveSheet((prev) => (prev === id ? null : id));
        }}
      />

      <Drawer
        onOpenChange={(open) => {
          if (!open) {
            closeSheet();
          }
        }}
        open={activeSheet !== null}
      >
        <DrawerContent
          aria-describedby={undefined}
          className={cn("px-0", activeSheet ? "" : "hidden")}
          data-testid={
            activeSheet ? `studio-mobile-sheet-${activeSheet}` : undefined
          }
        >
          <DrawerTitle className="sr-only">
            {activeSheet ? sheetTitle[activeSheet] : "Studio sheet"}
          </DrawerTitle>
          <div className="flex max-h-[min(88vh,88dvh)] min-h-[40vh] min-w-0 flex-col overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {activeSheet === "menu" ? (
              <MobileMenuSheet
                activeNavScreen={activeNavScreen}
                canRedo={canRedo}
                canUndo={canUndo}
                dirty={dirty}
                onPublish={() => {
                  onPublish();
                  closeSheet();
                }}
                onRedo={() => {
                  onRedo();
                  closeSheet();
                }}
                onSaveDraft={() => {
                  onSaveDraft();
                  closeSheet();
                }}
                onUndo={() => {
                  onUndo();
                  closeSheet();
                }}
                saving={saving}
              />
            ) : null}
            {activeSheet === "add" ? (
              <MobileAddSheet
                activeCatalog={addCatalog}
                onCatalogChange={setAddCatalog}
              />
            ) : null}
            {activeSheet === "layers" ? (
              <MobileLayersSheet
                activeTab={layersTab}
                composition={composition}
                compositionId={compositionId}
                onPageTemplateListFilterChange={onPageTemplateListFilterChange}
                onRemoveNode={onRemoveNode}
                onSelect={(nodeId) => {
                  selectFromSheet(nodeId);
                  closeSheet();
                }}
                onTabChange={setLayersTab}
                onWrapNode={onWrapNode}
                pageTemplateListFilter={pageTemplateListFilter}
                selectedNodeId={selectedNodeId}
                studioResource={studioResource}
              />
            ) : null}
            {activeSheet === "inspect" ? (
              <MobileInspectSheet
                activeBreakpoint={activeBreakpoint}
                activeInspectorTab={activeInspectorTab}
                clearNodeStyles={clearNodeStyles}
                componentsHref={componentsHref}
                composition={composition}
                node={selectedNode}
                onInspectorTabChange={onInspectorTabChange}
                onNodeStyleEntry={onNodeStyleEntry}
                onTextChange={onTextChange}
                patchNodeProps={patchNodeProps}
                resetNodePropKey={resetNodePropKey}
                setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
                setNodeEditorFieldBinding={setNodeEditorFieldBinding}
                tokenMetadata={tokenMetadata}
              />
            ) : null}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

/**
 * Stable "previous value" of `stagedTapInsertion` so we can detect the
 * transition from armed → cleared (i.e. a tap-to-insert completed).
 */
function usePreviousStaging(value: StagedTapInsertion | null) {
  const [previous, setPrevious] = useState<StagedTapInsertion | null>(null);
  useEffect(() => {
    setPrevious(value);
  }, [value]);
  return previous;
}

function MobileMenuSheet({
  activeNavScreen,
  canRedo,
  canUndo,
  dirty,
  onPublish,
  onRedo,
  onSaveDraft,
  onUndo,
  saving,
}: {
  activeNavScreen: StudioTopLevelScreen | null;
  canRedo: boolean;
  canUndo: boolean;
  dirty: boolean;
  onPublish: () => void;
  onRedo: () => void;
  onSaveDraft: () => void;
  onUndo: () => void;
  saving: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4">
      <div className="flex items-center gap-2">
        <Button
          aria-label="Undo"
          className="flex-1"
          disabled={!canUndo || saving}
          onClick={onUndo}
          size="lg"
          type="button"
          variant="outline"
        >
          <IconArrowBackUp aria-hidden className="size-4" />
          Undo
        </Button>
        <Button
          aria-label="Redo"
          className="flex-1"
          disabled={!canRedo || saving}
          onClick={onRedo}
          size="lg"
          type="button"
          variant="outline"
        >
          <IconArrowForwardUp aria-hidden className="size-4" />
          Redo
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Button
          className="h-12 justify-start gap-2 text-base"
          disabled={!dirty || saving}
          onClick={onSaveDraft}
          type="button"
          variant="outline"
        >
          <IconDeviceFloppy aria-hidden className="size-4" />
          Save draft
        </Button>
        <Button
          className="h-12 justify-start gap-2 text-base"
          disabled={saving}
          onClick={onPublish}
          type="button"
        >
          <IconRocket aria-hidden className="size-4" />
          Publish
        </Button>
      </div>
      <Separator className="my-2" />
      <div className="flex flex-col gap-1 text-sm">
        {STUDIO_NAV_ITEMS.map(({ id, href, Icon, label }) => {
          const isActive = activeNavScreen === id;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex h-11 items-center gap-2 rounded-md px-2 text-foreground hover:bg-accent",
                isActive && "bg-accent text-accent-foreground",
              )}
              href={href}
              key={id}
              prefetch={false}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function MobileAddSheet({
  activeCatalog,
  onCatalogChange,
}: {
  activeCatalog: MobileAddCatalog;
  onCatalogChange: (value: MobileAddCatalog) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <p className="text-xs leading-snug text-muted-foreground">
        Tap an item to arm it, then tap a spot on the canvas to place it.
        Long-press to drag instead.
      </p>
      <Tabs
        className="flex min-h-0 flex-1 flex-col"
        onValueChange={(value) => {
          if (value === "primitives" || value === "components") {
            onCatalogChange(value);
          }
        }}
        value={activeCatalog}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="primitives">Primitives</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
        </TabsList>
        <TabsContent
          className="mt-3 min-h-0 overflow-y-auto"
          value="primitives"
        >
          <PrimitiveCatalog />
        </TabsContent>
        <TabsContent
          className="mt-3 min-h-0 overflow-y-auto"
          value="components"
        >
          <LibraryComponentCatalog />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MobileLayersSheet({
  activeTab,
  composition,
  compositionId,
  onPageTemplateListFilterChange,
  onRemoveNode,
  onSelect,
  onTabChange,
  onWrapNode,
  pageTemplateListFilter,
  selectedNodeId,
  studioResource,
}: {
  activeTab: MobileLayersTab;
  composition: PageComposition;
  compositionId: string;
  onPageTemplateListFilterChange: (value: PageTemplateListFilter) => void;
  onRemoveNode: (id: string) => void;
  onSelect: (id: string | null) => void;
  onTabChange: (value: MobileLayersTab) => void;
  onWrapNode: (id: string) => void;
  pageTemplateListFilter: PageTemplateListFilter;
  selectedNodeId: string | null;
  studioResource: "pageTemplate" | "component" | null;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-2 pb-4">
      <Tabs
        className="flex min-h-0 flex-1 flex-col"
        onValueChange={(value) => {
          if (value === "layers" || value === "pageTemplates") {
            onTabChange(value);
          }
        }}
        value={activeTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="layers">Layers</TabsTrigger>
          <TabsTrigger value="pageTemplates">Templates</TabsTrigger>
        </TabsList>
        <TabsContent className="mt-3 min-h-0 overflow-y-auto" value="layers">
          <NodeTree
            composition={composition}
            onRemoveNode={onRemoveNode}
            onSelect={onSelect}
            onWrapNode={onWrapNode}
            selectedNodeId={selectedNodeId}
            studioResource={studioResource}
          />
        </TabsContent>
        <TabsContent
          className="mt-3 flex min-h-0 flex-col gap-2 overflow-y-auto"
          value="pageTemplates"
        >
          <div className="flex items-center justify-end">
            <PageTemplateListFilterSelect
              onValueChange={onPageTemplateListFilterChange}
              value={pageTemplateListFilter}
            />
          </div>
          <div className="min-h-0 flex-1">
            <PageTemplatesPanel
              activeCompositionId={compositionId}
              statusFilter={pageTemplateListFilter}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MobileInspectSheet({
  activeBreakpoint,
  activeInspectorTab,
  clearNodeStyles,
  componentsHref,
  composition,
  node,
  onInspectorTabChange,
  onNodeStyleEntry,
  onTextChange,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  activeInspectorTab: StudioInspectorTab;
  clearNodeStyles: () => void;
  componentsHref: string;
  composition: PageComposition;
  node: CompositionNode | null;
  onInspectorTabChange: (tab: StudioInspectorTab) => void;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  onTextChange: (content: string) => void;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
  tokenMetadata: TokenMeta[];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4">
      <PropertyInspector
        activeBreakpoint={activeBreakpoint}
        clearNodeStyles={clearNodeStyles}
        componentsHref={componentsHref}
        composition={composition}
        inspectorTab={activeInspectorTab}
        node={node}
        onInspectorTabChange={onInspectorTabChange}
        onNodeStyleEntry={onNodeStyleEntry}
        onTextChange={onTextChange}
        patchNodeProps={patchNodeProps}
        resetNodePropKey={resetNodePropKey}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
        setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        tokenMetadata={tokenMetadata}
      />
    </div>
  );
}
