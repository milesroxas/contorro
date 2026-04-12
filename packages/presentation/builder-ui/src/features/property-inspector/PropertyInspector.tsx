"use client";

import {
  type CompositionNode,
  EDITOR_SLOT_TYPES,
  type PageComposition,
  type SlotDefinition,
  SlotDefinitionSchema,
} from "@repo/contracts-zod";
import { useEffect, useId, useState } from "react";

import { Checkbox } from "../../components/ui/checkbox.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { cn } from "../../lib/cn.js";

function readBackgroundToken(
  composition: PageComposition,
  node: CompositionNode,
): string {
  if (!node.styleBindingId) {
    return "";
  }
  const sb = composition.styleBindings[node.styleBindingId];
  if (!sb) {
    return "";
  }
  const t = sb.properties.find(
    (p) => p.type === "token" && p.property === "background",
  );
  return t?.type === "token" ? t.token : "";
}

function TextPrimitiveInspector({
  node,
  content,
  slotBound,
  exposeSlot,
  onTextChange,
  setNodeSlotBinding,
}: {
  node: CompositionNode;
  content: string;
  slotBound: SlotDefinition | undefined;
  exposeSlot: boolean;
  onTextChange: (content: string) => void;
  setNodeSlotBinding: (slot: SlotDefinition | null) => void;
}) {
  const baseId = useId();
  const contentId = `${baseId}-content`;
  const exposeId = `${baseId}-expose`;
  const slotNameId = `${baseId}-slot-name`;
  const slotLabelId = `${baseId}-slot-label`;
  const slotDefaultId = `${baseId}-slot-default`;
  const slotTypeId = `${baseId}-slot-type`;

  const [nameDraft, setNameDraft] = useState(() => slotBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => slotBound?.label ?? "");
  const [slotError, setSlotError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync drafts from committed slot fields only; slotBound identity changes every parent render
  useEffect(() => {
    if (!exposeSlot) {
      setNameDraft("");
      setLabelDraft("");
      setSlotError(null);
      return;
    }
    if (!slotBound) {
      return;
    }
    setNameDraft(slotBound.name);
    setLabelDraft(slotBound.label);
    setSlotError(null);
  }, [node.id, exposeSlot, slotBound?.name, slotBound?.label]);

  function applySlot(next: SlotDefinition) {
    const parsed = SlotDefinitionSchema.safeParse(next);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid slot";
      setSlotError(msg);
      return;
    }
    setSlotError(null);
    setNodeSlotBinding(parsed.data);
  }

  return (
    <>
      <div className="space-y-2">
        <Label className="text-xs" htmlFor={contentId}>
          Content
        </Label>
        <Input
          data-testid="inspector-text-content"
          id={contentId}
          onChange={(e) => onTextChange(e.target.value)}
          type="text"
          value={content}
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          checked={exposeSlot}
          id={exposeId}
          onChange={(e) => {
            if (e.target.checked) {
              applySlot({
                name: "content",
                type: "text",
                required: false,
                label: "Content",
                defaultValue: content,
              });
            } else {
              setSlotError(null);
              setNodeSlotBinding(null);
            }
          }}
        />
        <Label className="text-xs font-normal" htmlFor={exposeId}>
          Expose as slot
        </Label>
      </div>
      {exposeSlot && slotBound ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={slotNameId}
            >
              Slot name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(slotError)}
              className="h-8 text-xs"
              data-testid="inspector-slot-name"
              id={slotNameId}
              onBlur={() => {
                if (!slotBound) {
                  return;
                }
                const trimmed = nameDraft.trim();
                applySlot({
                  ...slotBound,
                  name: trimmed,
                });
              }}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setSlotError(null);
              }}
              placeholder="hero-title"
              spellCheck={false}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={slotLabelId}
            >
              Label
            </Label>
            <Input
              className="h-8 text-xs"
              id={slotLabelId}
              onBlur={() => {
                if (!slotBound) {
                  return;
                }
                const label = labelDraft.trim() || "Content";
                applySlot({
                  ...slotBound,
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => {
                setLabelDraft(e.target.value);
                setSlotError(null);
              }}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={slotTypeId}
            >
              Editor field type
            </Label>
            <select
              className={cn(
                "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm",
                "focus-visible:ring-1 focus-visible:ring-ring/50 focus-visible:outline-none",
              )}
              data-testid="inspector-slot-type"
              id={slotTypeId}
              onChange={(e) => {
                const type = e.target.value as SlotDefinition["type"];
                if (!slotBound) {
                  return;
                }
                applySlot({
                  ...slotBound,
                  type,
                });
              }}
              value={slotBound.type}
            >
              {EDITOR_SLOT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={slotBound.required}
              id={`${baseId}-req`}
              onChange={(e) => {
                if (!slotBound) {
                  return;
                }
                applySlot({
                  ...slotBound,
                  required: e.target.checked,
                });
              }}
            />
            <Label className="text-xs font-normal" htmlFor={`${baseId}-req`}>
              Required
            </Label>
          </div>
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={slotDefaultId}
            >
              Default value
            </Label>
            <Input
              className="h-8 text-xs"
              id={slotDefaultId}
              onChange={(e) => {
                if (!slotBound) {
                  return;
                }
                applySlot({
                  ...slotBound,
                  defaultValue: e.target.value,
                });
              }}
              type="text"
              value={
                typeof slotBound.defaultValue === "string"
                  ? slotBound.defaultValue
                  : ""
              }
            />
          </div>
          {slotError ? (
            <p className="text-xs text-destructive" role="alert">
              {slotError}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function PropertyInspector({
  composition,
  node,
  onTextChange,
  onBackgroundToken,
  patchNodeProps,
  setNodeSlotBinding,
}: {
  composition: PageComposition | null;
  node: CompositionNode | null;
  onTextChange: (content: string) => void;
  onBackgroundToken: (token: string) => void;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  setNodeSlotBinding: (slot: SlotDefinition | null) => void;
}) {
  if (!node || !composition) {
    return (
      <div className="text-sm text-muted-foreground">
        Select an element on the canvas or in layers.
      </div>
    );
  }

  const isText = node.definitionKey === "primitive.text";
  const isBox = node.definitionKey === "primitive.box";
  const isStack = node.definitionKey === "primitive.stack";

  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const bgToken = readBackgroundToken(composition, node);

  const slotBound =
    node.contentBinding?.source === "slot"
      ? node.contentBinding.slot
      : undefined;
  const exposeSlot = Boolean(slotBound);

  return (
    <div className="space-y-4 text-sm">
      <div className="font-mono text-xs text-muted-foreground">
        {node.definitionKey}
      </div>
      {isText ? (
        <TextPrimitiveInspector
          content={content}
          exposeSlot={exposeSlot}
          node={node}
          onTextChange={onTextChange}
          setNodeSlotBinding={setNodeSlotBinding}
          slotBound={slotBound}
        />
      ) : null}
      {isStack ? (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div className="text-xs font-medium text-foreground">
            Stack layout
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Direction</span>
            <select
              className={cn(
                "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
              onChange={(e) => {
                patchNodeProps({ direction: e.target.value });
              }}
              value={
                (node.propValues?.direction as string | undefined) === "row"
                  ? "row"
                  : "column"
              }
            >
              <option value="column">column</option>
              <option value="row">row</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Gap</span>
            <input
              className={cn(
                "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
              onChange={(e) => {
                patchNodeProps({ gap: e.target.value });
              }}
              type="text"
              value={String(node.propValues?.gap ?? "8px")}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Align</span>
            <select
              className={cn(
                "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
              onChange={(e) => {
                patchNodeProps({ align: e.target.value });
              }}
              value={String(node.propValues?.align ?? "stretch")}
            >
              <option value="stretch">stretch</option>
              <option value="flex-start">flex-start</option>
              <option value="flex-end">flex-end</option>
              <option value="center">center</option>
              <option value="baseline">baseline</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground">Justify</span>
            <select
              className={cn(
                "flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs shadow-sm",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              )}
              onChange={(e) => {
                patchNodeProps({ justify: e.target.value });
              }}
              value={String(node.propValues?.justify ?? "flex-start")}
            >
              <option value="flex-start">flex-start</option>
              <option value="flex-end">flex-end</option>
              <option value="center">center</option>
              <option value="space-between">space-between</option>
              <option value="space-around">space-around</option>
              <option value="space-evenly">space-evenly</option>
            </select>
          </label>
        </div>
      ) : null}
      {isBox ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-foreground">
            Background token
          </span>
          <input
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            data-testid="inspector-box-background-token"
            onChange={(e) => onBackgroundToken(e.target.value)}
            placeholder="color.surface.primary"
            type="text"
            value={bgToken}
          />
        </label>
      ) : null}
    </div>
  );
}
