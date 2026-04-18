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
import type { StyleSectionId } from "@repo/domains-composition";
import { useState } from "react";

import type { StudioInspectorTab } from "../../lib/inspector-tab-shortcuts.js";
import { PropertyInspectorActive } from "./property-inspector-active.js";

export function PropertyInspector({
  activeBreakpoint,
  clearNodeStyles,
  componentsHref = "",
  composition,
  inspectorTab,
  node,
  onInspectorTabChange,
  onNodeStyleEntry,
  onTextChange,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
  studioResource,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  clearNodeStyles: () => void;
  componentsHref?: string;
  composition: PageComposition | null;
  inspectorTab: StudioInspectorTab;
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
  studioResource?: "pageTemplate" | "component" | null;
  tokenMetadata: TokenMeta[];
}) {
  const [styleSectionOpenState, setStyleSectionOpenState] = useState<
    Partial<Record<StyleSectionId, boolean>>
  >({});

  if (!node || !composition) {
    return (
      <div className="text-sm text-muted-foreground">
        Select an element on the canvas or in layers.
      </div>
    );
  }

  const pageTemplateStudio = studioResource === "pageTemplate";

  return (
    <PropertyInspectorActive
      activeBreakpoint={activeBreakpoint}
      clearNodeStyles={clearNodeStyles}
      componentsHref={componentsHref}
      composition={composition}
      inspectorTab={inspectorTab}
      node={node}
      onInspectorTabChange={onInspectorTabChange}
      onNodeStyleEntry={onNodeStyleEntry}
      onTextChange={onTextChange}
      pageTemplateStudio={pageTemplateStudio}
      patchNodeProps={patchNodeProps}
      resetNodePropKey={resetNodePropKey}
      setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      setNodeEditorFieldBinding={setNodeEditorFieldBinding}
      setStyleSectionOpenState={setStyleSectionOpenState}
      styleSectionOpenState={styleSectionOpenState}
      tokenMetadata={tokenMetadata}
    />
  );
}
