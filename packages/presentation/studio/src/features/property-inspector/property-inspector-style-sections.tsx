"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import type {
  Breakpoint,
  CompositionNode,
  PageComposition,
  StyleProperty,
  StylePropertyEntry,
} from "@repo/contracts-zod";
import type { StyleSectionId } from "@repo/domains-composition";
import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "../../components/ui/button.js";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../components/ui/collapsible.js";
import { BoxPrimitiveBackgroundImageSection } from "./box-primitive-background-image-section.js";
import { BorderControl } from "./property-inspector-border-controls.js";
import { SpacingBoxControl } from "./property-inspector-spacing-controls.js";
import {
  type InspectorOrderedStyleSection,
  inspectorStyleSectionModelFromSection,
  inspectorStyleSectionTopClass,
  moreOptionsGridClassName,
  readStyleEntryCascade,
} from "./property-inspector-style-model.js";
import { StyleValueSelect } from "./property-inspector-style-value-controls.js";

function InspectorStyleValueGrid({
  activeBreakpoint,
  composition,
  node,
  onNodeStyleEntry,
  properties,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  composition: PageComposition;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  properties: readonly StyleProperty[];
  tokenMetadata: TokenMeta[];
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4">
      {properties.map((property) => {
        const cascade = readStyleEntryCascade(
          composition,
          node,
          property,
          activeBreakpoint,
        );
        return (
          <StyleValueSelect
            key={property}
            inheritedEntry={cascade.inherited ? cascade.base : undefined}
            onNodeStyleEntry={onNodeStyleEntry}
            property={property}
            tokenMetadata={tokenMetadata}
            valueEntry={cascade.active}
          />
        );
      })}
    </div>
  );
}

function InspectorStyleMoreOptionsBlock({
  activeBreakpoint,
  composition,
  groupedSecondaryProperties,
  moreOptionsLabel,
  node,
  onNodeStyleEntry,
  sectionId,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  composition: PageComposition;
  groupedSecondaryProperties: StyleProperty[];
  moreOptionsLabel: string;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  sectionId: StyleSectionId;
  tokenMetadata: TokenMeta[];
}) {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button
          className="h-8 w-full justify-between px-2 text-xs"
          type="button"
          variant="ghost"
        >
          <span>{moreOptionsLabel}</span>
          <span className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {groupedSecondaryProperties.length}
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3">
        <div className={moreOptionsGridClassName(sectionId)}>
          {groupedSecondaryProperties.map((property) => {
            const cascade = readStyleEntryCascade(
              composition,
              node,
              property,
              activeBreakpoint,
            );
            return (
              <StyleValueSelect
                key={property}
                inheritedEntry={cascade.inherited ? cascade.base : undefined}
                onNodeStyleEntry={onNodeStyleEntry}
                property={property}
                tokenMetadata={tokenMetadata}
                valueEntry={cascade.active}
              />
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function InspectorSpacingStyleSection({
  activeBreakpoint,
  composition,
  isStyleSectionOpen,
  model,
  node,
  onNodeStyleEntry,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  composition: PageComposition;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  model: NonNullable<ReturnType<typeof inspectorStyleSectionModelFromSection>>;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  const showMoreOptions =
    model.secondaryProperties.length > 0 && model.primaryProperties.length > 0;
  return (
    <div className={`${inspectorStyleSectionTopClass(sectionIndex)}space-y-4`}>
      <Collapsible
        onOpenChange={(open) => setStyleSectionOpen(section.id, open)}
        open={isStyleSectionOpen(section.id)}
      >
        <CollapsibleTrigger asChild>
          <Button
            className="group w-full justify-between px-1"
            size="panel"
            type="button"
            variant="panel"
          >
            <span className="flex items-center gap-1.5">
              <section.Icon
                aria-hidden
                className="size-3.5 text-muted-foreground/90"
                stroke={1.7}
              />
              <span>Margin & Padding</span>
            </span>
            <IconChevronDown
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              stroke={1.8}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <SpacingBoxControl
            activeBreakpoint={activeBreakpoint}
            availableProperties={new Set(model.sectionProperties)}
            composition={composition}
            node={node}
            onNodeStyleEntry={onNodeStyleEntry}
          />
          {model.visibleProperties.length > 0 ? (
            <InspectorStyleValueGrid
              activeBreakpoint={activeBreakpoint}
              composition={composition}
              node={node}
              onNodeStyleEntry={onNodeStyleEntry}
              properties={model.visibleProperties}
              tokenMetadata={tokenMetadata}
            />
          ) : null}
          {showMoreOptions ? (
            <InspectorStyleMoreOptionsBlock
              activeBreakpoint={activeBreakpoint}
              composition={composition}
              groupedSecondaryProperties={model.groupedSecondaryProperties}
              moreOptionsLabel="More spacing options"
              node={node}
              onNodeStyleEntry={onNodeStyleEntry}
              sectionId={section.id}
              tokenMetadata={tokenMetadata}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function InspectorBorderStyleSection({
  activeBreakpoint,
  composition,
  isStyleSectionOpen,
  model,
  node,
  onNodeStyleEntry,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  composition: PageComposition;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  model: NonNullable<ReturnType<typeof inspectorStyleSectionModelFromSection>>;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  return (
    <div className={`${inspectorStyleSectionTopClass(sectionIndex)}space-y-4`}>
      <Collapsible
        onOpenChange={(open) => setStyleSectionOpen(section.id, open)}
        open={isStyleSectionOpen(section.id)}
      >
        <CollapsibleTrigger asChild>
          <Button
            className="group w-full justify-between px-1"
            size="panel"
            type="button"
            variant="panel"
          >
            <span className="flex items-center gap-1.5">
              <section.Icon
                aria-hidden
                className="size-3.5 text-muted-foreground/90"
                stroke={1.7}
              />
              <span>{section.label}</span>
            </span>
            <IconChevronDown
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              stroke={1.8}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <BorderControl
            activeBreakpoint={activeBreakpoint}
            availableProperties={new Set(model.filteredSectionProperties)}
            composition={composition}
            node={node}
            onNodeStyleEntry={onNodeStyleEntry}
            tokenMetadata={tokenMetadata}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function InspectorDefaultStyleSection({
  activeBreakpoint,
  composition,
  isStyleSectionOpen,
  model,
  node,
  onNodeStyleEntry,
  patchNodeProps,
  resetNodePropKey,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  composition: PageComposition;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  model: NonNullable<ReturnType<typeof inspectorStyleSectionModelFromSection>>;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  patchNodeProps?: (patch: Record<string, unknown>) => void;
  resetNodePropKey?: (propKey: string) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  const showMoreOptions =
    model.secondaryProperties.length > 0 && model.primaryProperties.length > 0;
  return (
    <div className={`${inspectorStyleSectionTopClass(sectionIndex)}space-y-4`}>
      <Collapsible
        onOpenChange={(open) => setStyleSectionOpen(section.id, open)}
        open={isStyleSectionOpen(section.id)}
      >
        <CollapsibleTrigger asChild>
          <Button
            className="group w-full justify-between px-1"
            size="panel"
            type="button"
            variant="panel"
          >
            <span className="flex items-center gap-1.5">
              <section.Icon
                aria-hidden
                className="size-3.5 text-muted-foreground/90"
                stroke={1.7}
              />
              <span>{section.label}</span>
            </span>
            <IconChevronDown
              aria-hidden
              className="size-3.5 transition-transform group-data-[state=open]:rotate-180"
              stroke={1.8}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <InspectorStyleValueGrid
            activeBreakpoint={activeBreakpoint}
            composition={composition}
            node={node}
            onNodeStyleEntry={onNodeStyleEntry}
            properties={model.visibleProperties}
            tokenMetadata={tokenMetadata}
          />
          {showMoreOptions ? (
            <InspectorStyleMoreOptionsBlock
              activeBreakpoint={activeBreakpoint}
              composition={composition}
              groupedSecondaryProperties={model.groupedSecondaryProperties}
              moreOptionsLabel={`More ${section.label.toLowerCase()} options`}
              node={node}
              onNodeStyleEntry={onNodeStyleEntry}
              sectionId={section.id}
              tokenMetadata={tokenMetadata}
            />
          ) : null}
          {section.id === "color" &&
          node.definitionKey === "primitive.box" &&
          patchNodeProps &&
          resetNodePropKey ? (
            <BoxPrimitiveBackgroundImageSection
              node={node}
              patchNodeProps={patchNodeProps}
              resetNodePropKey={resetNodePropKey}
            />
          ) : null}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export function InspectorOrderedStyleSectionItem({
  activeBreakpoint,
  composition,
  gapPropertyAvailable,
  isStyleSectionOpen,
  node,
  onNodeStyleEntry,
  patchNodeProps,
  resetNodePropKey,
  section,
  sectionIndex,
  setStyleSectionOpen,
  tokenMetadata,
}: {
  activeBreakpoint: Breakpoint | null;
  composition: PageComposition;
  gapPropertyAvailable: boolean;
  isStyleSectionOpen: (sectionId: StyleSectionId) => boolean;
  node: CompositionNode;
  onNodeStyleEntry: (
    property: StyleProperty,
    entry: StylePropertyEntry | null,
  ) => void;
  patchNodeProps?: (patch: Record<string, unknown>) => void;
  resetNodePropKey?: (propKey: string) => void;
  section: InspectorOrderedStyleSection;
  sectionIndex: number;
  setStyleSectionOpen: (sectionId: StyleSectionId, open: boolean) => void;
  tokenMetadata: TokenMeta[];
}) {
  const model = inspectorStyleSectionModelFromSection(
    section,
    gapPropertyAvailable,
  );
  if (!model) {
    return null;
  }
  if (section.id === "spacing") {
    return (
      <InspectorSpacingStyleSection
        activeBreakpoint={activeBreakpoint}
        composition={composition}
        isStyleSectionOpen={isStyleSectionOpen}
        model={model}
        node={node}
        onNodeStyleEntry={onNodeStyleEntry}
        section={section}
        sectionIndex={sectionIndex}
        setStyleSectionOpen={setStyleSectionOpen}
        tokenMetadata={tokenMetadata}
      />
    );
  }
  if (section.id === "border") {
    return (
      <InspectorBorderStyleSection
        activeBreakpoint={activeBreakpoint}
        composition={composition}
        isStyleSectionOpen={isStyleSectionOpen}
        model={model}
        node={node}
        onNodeStyleEntry={onNodeStyleEntry}
        section={section}
        sectionIndex={sectionIndex}
        setStyleSectionOpen={setStyleSectionOpen}
        tokenMetadata={tokenMetadata}
      />
    );
  }
  return (
    <InspectorDefaultStyleSection
      activeBreakpoint={activeBreakpoint}
      composition={composition}
      isStyleSectionOpen={isStyleSectionOpen}
      model={model}
      node={node}
      onNodeStyleEntry={onNodeStyleEntry}
      patchNodeProps={patchNodeProps}
      resetNodePropKey={resetNodePropKey}
      section={section}
      sectionIndex={sectionIndex}
      setStyleSectionOpen={setStyleSectionOpen}
      tokenMetadata={tokenMetadata}
    />
  );
}
