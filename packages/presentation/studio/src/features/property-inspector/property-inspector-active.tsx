"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import type {
  CompositionNode,
  EditorFieldSpec,
  PageComposition,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import {
  type StyleSectionId,
  stylePropertiesBySectionForDefinitionKey,
} from "@repo/domains-composition";
import { type Dispatch, type SetStateAction, useMemo } from "react";

import { StudioBulkCollapseButton } from "../../components/studio-panel.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs.js";
import { TooltipProvider } from "../../components/ui/tooltip.js";
import { cn } from "../../lib/cn.js";
import type { StudioInspectorTab } from "../../lib/inspector-tab-shortcuts.js";
import { getPrimitiveDisplay } from "../../lib/primitive-display.js";
import {
  libraryDisplayNameForKey,
  useLibraryComponentLabels,
} from "../../lib/use-library-component-labels.js";
import { CollectionPrimitiveInspector } from "./collection-primitive-inspector.js";
import { SettingsFieldRow } from "./property-control-label.js";
import { BoxPrimitiveInspector } from "./property-inspector-box-primitive.js";
import { semanticShellTagForNode } from "./property-inspector-node-meta.js";
import {
  ButtonPrimitiveInspector,
  HeadingPrimitiveInspector,
  ImagePrimitiveInspector,
  ImagePrimitiveTailwindUtilitiesField,
  TextPrimitiveInspector,
  VideoPrimitiveInspector,
} from "./property-inspector-primitive-inspectors.js";
import {
  collectStyleSectionIdsWithControls,
  nodeHasNonEmptyStyleBinding,
  orderedStyleSectionsForInspector,
} from "./property-inspector-style-model.js";
import { InspectorOrderedStyleSectionItem } from "./property-inspector-style-sections.js";

function PropertyInspectorSettingsTab({
  componentsHref,
  composition,
  content,
  exposeToEditors,
  fieldBound,
  isButton,
  isHeading,
  isImage,
  isVideo,
  isLibraryComponent,
  isSlot,
  isText,
  node,
  onTextChange,
  pageTemplateStudio,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  componentsHref: string;
  composition: PageComposition;
  content: string;
  exposeToEditors: boolean;
  fieldBound: EditorFieldSpec | undefined;
  isButton: boolean;
  isHeading: boolean;
  isImage: boolean;
  isVideo: boolean;
  isLibraryComponent: boolean;
  isSlot: boolean;
  isText: boolean;
  node: CompositionNode;
  onTextChange: (content: string) => void;
  pageTemplateStudio: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  return (
    <>
      {isText ? (
        <TextPrimitiveInspector
          composition={composition}
          content={content}
          exposeToEditors={exposeToEditors}
          fieldBound={fieldBound}
          node={node}
          onTextChange={onTextChange}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        />
      ) : null}
      {isHeading ? (
        <HeadingPrimitiveInspector
          composition={composition}
          exposeToEditors={exposeToEditors}
          fieldBound={fieldBound}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        />
      ) : null}
      {isButton ? (
        <ButtonPrimitiveInspector
          composition={composition}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
        />
      ) : null}
      {isImage ? (
        <ImagePrimitiveInspector
          composition={composition}
          exposeToEditors={exposeToEditors}
          fieldBound={fieldBound}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
        />
      ) : null}
      {isVideo ? (
        <VideoPrimitiveInspector
          composition={composition}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
        />
      ) : null}
      {isSlot ? (
        <div className="border-t border-border/60 pt-4">
          <SettingsFieldRow
            definitionKey={node.definitionKey}
            htmlFor="inspector-slot-id"
            label="Slot id"
            onResetProp={resetNodePropKey}
            propKey="slotId"
            propValues={node.propValues}
          >
            <Input
              data-testid="inspector-slot-id"
              id="inspector-slot-id"
              onChange={(e) => patchNodeProps({ slotId: e.target.value })}
              placeholder="main"
              type="text"
              value={
                typeof node.propValues?.slotId === "string"
                  ? node.propValues.slotId
                  : ""
              }
            />
          </SettingsFieldRow>
        </div>
      ) : null}
      {isLibraryComponent ? (
        <div className="space-y-2 border-t border-border/60 pt-4">
          {pageTemplateStudio ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              This block uses a published library component. Edit its layout and
              fields in Component studio — open it from{" "}
              <a
                className="font-medium text-foreground underline underline-offset-2 hover:no-underline"
                href={componentsHref}
              >
                Components
              </a>{" "}
              in the CMS.
            </p>
          ) : (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Open the referenced component in Component studio to edit its
              definition.
            </p>
          )}
        </div>
      ) : null}
      {node.definitionKey === "primitive.box" ? (
        <BoxPrimitiveInspector
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
        />
      ) : null}
      {node.definitionKey === "primitive.collection" ? (
        <CollectionPrimitiveInspector
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
        />
      ) : null}
    </>
  );
}

export function PropertyInspectorActive({
  clearNodeStyles,
  componentsHref,
  composition,
  inspectorTab,
  node,
  onInspectorTabChange,
  onNodeStyleEntry,
  onTextChange,
  pageTemplateStudio,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
  setStyleSectionOpenState,
  styleSectionOpenState,
  tokenMetadata,
}: {
  clearNodeStyles: () => void;
  componentsHref: string;
  composition: PageComposition;
  inspectorTab: StudioInspectorTab;
  node: CompositionNode;
  onInspectorTabChange: (tab: StudioInspectorTab) => void;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  onTextChange: (content: string) => void;
  pageTemplateStudio: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
  setStyleSectionOpenState: Dispatch<
    SetStateAction<Partial<Record<StyleSectionId, boolean>>>
  >;
  styleSectionOpenState: Partial<Record<StyleSectionId, boolean>>;
  tokenMetadata: TokenMeta[];
}) {
  const isText = node.definitionKey === "primitive.text";
  const isHeading = node.definitionKey === "primitive.heading";
  const isButton = node.definitionKey === "primitive.button";
  const isImage = node.definitionKey === "primitive.image";
  const isVideo = node.definitionKey === "primitive.video";
  const isSlot = node.definitionKey === "primitive.slot";
  const isLibraryComponent =
    node.definitionKey === "primitive.libraryComponent";

  const libraryLabels = useLibraryComponentLabels();
  const componentKey =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey
      : "";

  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const fieldBound =
    node.contentBinding?.source === "editor"
      ? node.contentBinding.editorField
      : undefined;
  const semanticShellTag = semanticShellTagForNode(node);
  const nodeLabel = useMemo(() => {
    if (isLibraryComponent) {
      return libraryDisplayNameForKey(libraryLabels, componentKey);
    }
    if (semanticShellTag) {
      return `${semanticShellTag.charAt(0).toUpperCase()}${semanticShellTag.slice(1)}`;
    }
    if (
      node.definitionKey === "primitive.box" &&
      node.propValues?.tag === "section"
    ) {
      return "Section";
    }
    return getPrimitiveDisplay(node.definitionKey).label;
  }, [
    componentKey,
    isLibraryComponent,
    libraryLabels,
    node.definitionKey,
    node.propValues?.tag,
    semanticShellTag,
  ]);
  const exposeToEditors = Boolean(fieldBound);
  const stylePropertiesBySection = stylePropertiesBySectionForDefinitionKey(
    node.definitionKey,
  );
  const orderedStyleSections = orderedStyleSectionsForInspector(
    stylePropertiesBySection,
  );
  const hasStyleControls = stylePropertiesBySection.length > 0;
  const hasStyleOverrides = nodeHasNonEmptyStyleBinding(composition, node);
  const gapPropertyAvailable = stylePropertiesBySection.some((section) =>
    section.properties.includes("gap"),
  );
  const isStyleSectionOpen = (sectionId: StyleSectionId) =>
    styleSectionOpenState[sectionId] ?? false;
  const setStyleSectionOpen = (sectionId: StyleSectionId, open: boolean) => {
    setStyleSectionOpenState((prev) => {
      if ((prev[sectionId] ?? false) === open) {
        return prev;
      }
      return { ...prev, [sectionId]: open };
    });
  };
  const styleSectionIdsWithControls = collectStyleSectionIdsWithControls(
    orderedStyleSections,
    gapPropertyAvailable,
  );
  const allStyleSectionsCollapsed =
    styleSectionIdsWithControls.length > 0 &&
    styleSectionIdsWithControls.every(
      (sectionId) => !isStyleSectionOpen(sectionId),
    );
  const showStyleToolbarActions =
    inspectorTab === "styles" &&
    hasStyleControls &&
    (styleSectionIdsWithControls.length > 0 || hasStyleOverrides);

  return (
    <TooltipProvider>
      <div className="min-w-0 space-y-4 text-sm">
        <Tabs
          className="min-h-0 w-full min-w-0"
          onValueChange={(value) => {
            if (value === "styles" || value === "settings") {
              onInspectorTabChange(value);
            }
          }}
          value={inspectorTab}
        >
          <div
            className={cn(
              "text-base font-semibold text-foreground",
              isLibraryComponent
                ? "normal-case tracking-tight"
                : "uppercase tracking-[0.1em]",
            )}
          >
            {nodeLabel}
          </div>
          <div className="mt-3 space-y-2">
            <TabsList className="grid w-fit shrink-0 grid-cols-2">
              <TabsTrigger
                aria-keyshortcuts="4"
                title="Styles (4)"
                value="styles"
              >
                Styles
              </TabsTrigger>
              <TabsTrigger
                aria-keyshortcuts="5"
                title="Settings (5)"
                value="settings"
              >
                Settings
              </TabsTrigger>
            </TabsList>
            {showStyleToolbarActions ? (
              <div className="flex items-center gap-2">
                {hasStyleOverrides ? (
                  <Button
                    className="shrink-0"
                    onClick={clearNodeStyles}
                    size="panel"
                    type="button"
                    variant="outline"
                  >
                    Reset styles
                  </Button>
                ) : null}
                {styleSectionIdsWithControls.length > 0 ? (
                  <StudioBulkCollapseButton
                    allCollapsed={allStyleSectionsCollapsed}
                    className="ml-auto"
                    onClick={() => {
                      const nextOpen = allStyleSectionsCollapsed;
                      setStyleSectionOpenState((prev) => {
                        const next = { ...prev };
                        for (const sectionId of styleSectionIdsWithControls) {
                          next[sectionId] = nextOpen;
                        }
                        return next;
                      });
                    }}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
          <TabsContent className="mt-4 min-w-0" value="styles">
            {hasStyleControls ? (
              <div className="space-y-4">
                {orderedStyleSections.map((section, sectionIndex) => (
                  <InspectorOrderedStyleSectionItem
                    key={section.id}
                    composition={composition}
                    gapPropertyAvailable={gapPropertyAvailable}
                    isStyleSectionOpen={isStyleSectionOpen}
                    node={node}
                    onNodeStyleEntry={onNodeStyleEntry}
                    patchNodeProps={patchNodeProps}
                    resetNodePropKey={resetNodePropKey}
                    section={section}
                    sectionIndex={sectionIndex}
                    setStyleSectionOpen={setStyleSectionOpen}
                    tokenMetadata={tokenMetadata}
                  />
                ))}
                {isImage ? (
                  <ImagePrimitiveTailwindUtilitiesField
                    node={node}
                    patchNodeProps={patchNodeProps}
                    resetNodePropKey={resetNodePropKey}
                  />
                ) : null}
              </div>
            ) : (
              <div className="rounded-md border border-border/70 bg-muted/20 p-2.5 text-xs leading-snug text-muted-foreground">
                No style controls available for this element.
              </div>
            )}
          </TabsContent>
          <TabsContent className="mt-4 min-w-0 space-y-4" value="settings">
            <PropertyInspectorSettingsTab
              componentsHref={componentsHref}
              composition={composition}
              content={content}
              exposeToEditors={exposeToEditors}
              fieldBound={fieldBound}
              isButton={isButton}
              isHeading={isHeading}
              isImage={isImage}
              isVideo={isVideo}
              isLibraryComponent={isLibraryComponent}
              isSlot={isSlot}
              isText={isText}
              node={node}
              onTextChange={onTextChange}
              pageTemplateStudio={pageTemplateStudio}
              patchNodeProps={patchNodeProps}
              resetNodePropKey={resetNodePropKey}
              setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
              setNodeEditorFieldBinding={setNodeEditorFieldBinding}
            />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
