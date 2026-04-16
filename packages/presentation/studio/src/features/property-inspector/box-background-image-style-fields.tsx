"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import {
  BACKGROUND_IMAGE_ATTACHMENT_OPTIONS,
  BACKGROUND_IMAGE_CLIP_OPTIONS,
  BACKGROUND_IMAGE_ORIGIN_OPTIONS,
  BACKGROUND_IMAGE_POSITION_OPTIONS,
  BACKGROUND_IMAGE_REPEAT_OPTIONS,
  BACKGROUND_IMAGE_SIZE_OPTIONS,
  type BoxBackgroundImageStylePropKey,
  normalizedBackgroundImageAttachment,
  normalizedBackgroundImageClip,
  normalizedBackgroundImageOrigin,
  normalizedBackgroundImagePosition,
  normalizedBackgroundImageRepeat,
  normalizedBackgroundImageSize,
} from "@repo/domains-composition";
import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { SettingsFieldRow } from "./property-control-label.js";

function BackgroundImageStyleSelectRow({
  baseId,
  definitionKey,
  label,
  node,
  normalize,
  options,
  patchNodeProps,
  propKey,
  resetNodePropKey,
}: {
  baseId: string;
  definitionKey: string;
  label: string;
  node: CompositionNode;
  normalize: (raw: unknown) => string;
  options: ReadonlyArray<{ label: string; tailwind: string; value: string }>;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  propKey: BoxBackgroundImageStylePropKey;
  resetNodePropKey: (propKey: string) => void;
}) {
  const value = normalize(node.propValues?.[propKey]);
  const selectedOption = options.find((o) => o.value === value);
  return (
    <SettingsFieldRow
      definitionKey={definitionKey}
      htmlFor={`${baseId}-${propKey}`}
      label={label}
      onResetProp={resetNodePropKey}
      propKey={propKey}
      propValues={node.propValues}
    >
      <Select
        onValueChange={(next) => patchNodeProps({ [propKey]: next })}
        value={value}
      >
        <SelectTrigger className="w-full" id={`${baseId}-${propKey}`}>
          <SelectValue placeholder={label}>
            {selectedOption?.label ?? value}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              <span className="flex w-full min-w-0 items-baseline justify-between gap-3">
                <span>{opt.label}</span>
                <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                  {opt.tailwind}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingsFieldRow>
  );
}

function StyleFieldGroup({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/15 p-3">
      <div className="mb-3 space-y-0.5">
        <p className="text-[11px] font-medium text-foreground">{title}</p>
        <p className="text-[10px] leading-snug text-muted-foreground">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function BoxBackgroundImageStyleFields({
  baseId,
  definitionKey,
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  baseId: string;
  definitionKey: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  return (
    <div className="space-y-3">
      <StyleFieldGroup
        description="Size and focal point. Same tokens as Tailwind bg-size and bg-position."
        title="Fit and position"
      >
        <BackgroundImageStyleSelectRow
          baseId={baseId}
          definitionKey={definitionKey}
          label="Size"
          node={node}
          normalize={(raw) => normalizedBackgroundImageSize(raw)}
          options={BACKGROUND_IMAGE_SIZE_OPTIONS}
          patchNodeProps={patchNodeProps}
          propKey="backgroundImageSize"
          resetNodePropKey={resetNodePropKey}
        />
        <BackgroundImageStyleSelectRow
          baseId={baseId}
          definitionKey={definitionKey}
          label="Position"
          node={node}
          normalize={(raw) => normalizedBackgroundImagePosition(raw)}
          options={BACKGROUND_IMAGE_POSITION_OPTIONS}
          patchNodeProps={patchNodeProps}
          propKey="backgroundImagePosition"
          resetNodePropKey={resetNodePropKey}
        />
      </StyleFieldGroup>
      <StyleFieldGroup
        description="Repeat pattern and whether the image scrolls with the page. Matches bg-repeat and bg-* attachment utilities."
        title="Tiling and motion"
      >
        <BackgroundImageStyleSelectRow
          baseId={baseId}
          definitionKey={definitionKey}
          label="Repeat"
          node={node}
          normalize={(raw) => normalizedBackgroundImageRepeat(raw)}
          options={BACKGROUND_IMAGE_REPEAT_OPTIONS}
          patchNodeProps={patchNodeProps}
          propKey="backgroundImageRepeat"
          resetNodePropKey={resetNodePropKey}
        />
        <BackgroundImageStyleSelectRow
          baseId={baseId}
          definitionKey={definitionKey}
          label="Attachment"
          node={node}
          normalize={(raw) => normalizedBackgroundImageAttachment(raw)}
          options={BACKGROUND_IMAGE_ATTACHMENT_OPTIONS}
          patchNodeProps={patchNodeProps}
          propKey="backgroundImageAttachment"
          resetNodePropKey={resetNodePropKey}
        />
      </StyleFieldGroup>
      <StyleFieldGroup
        description="Where the background is positioned relative to the box and how it is clipped. Same as bg-origin and bg-clip."
        title="Bounds"
      >
        <BackgroundImageStyleSelectRow
          baseId={baseId}
          definitionKey={definitionKey}
          label="Origin"
          node={node}
          normalize={(raw) => normalizedBackgroundImageOrigin(raw)}
          options={BACKGROUND_IMAGE_ORIGIN_OPTIONS}
          patchNodeProps={patchNodeProps}
          propKey="backgroundImageOrigin"
          resetNodePropKey={resetNodePropKey}
        />
        <BackgroundImageStyleSelectRow
          baseId={baseId}
          definitionKey={definitionKey}
          label="Clip"
          node={node}
          normalize={(raw) => normalizedBackgroundImageClip(raw)}
          options={BACKGROUND_IMAGE_CLIP_OPTIONS}
          patchNodeProps={patchNodeProps}
          propKey="backgroundImageClip"
          resetNodePropKey={resetNodePropKey}
        />
      </StyleFieldGroup>
    </div>
  );
}
