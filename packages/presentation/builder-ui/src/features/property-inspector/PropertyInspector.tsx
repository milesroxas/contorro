"use client";

import {
  type CompositionNode,
  EDITOR_FIELD_TYPES,
  type EditorFieldSpec,
  EditorFieldSpecSchema,
  type PageComposition,
  type StyleProperty,
  type StylePropertyEntry,
} from "@repo/contracts-zod";
import { useEffect, useId, useState } from "react";

import { Checkbox } from "../../components/ui/checkbox.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { cn } from "../../lib/cn.js";

function readStyleProperty(
  composition: PageComposition,
  node: CompositionNode,
  property: StyleProperty,
): StylePropertyEntry | undefined {
  if (!node.styleBindingId) {
    return undefined;
  }
  const sb = composition.styleBindings[node.styleBindingId];
  if (!sb) {
    return undefined;
  }
  return sb.properties.find((p) => p.property === property);
}

function TextPrimitiveInspector({
  node,
  content,
  fieldBound,
  exposeToEditors,
  onTextChange,
  setNodeEditorFieldBinding,
}: {
  node: CompositionNode;
  content: string;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  onTextChange: (content: string) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const contentId = `${baseId}-content`;
  const exposeId = `${baseId}-expose`;
  const slotNameId = `${baseId}-slot-name`;
  const slotLabelId = `${baseId}-slot-label`;
  const slotDefaultId = `${baseId}-slot-default`;
  const slotTypeId = `${baseId}-slot-type`;

  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: sync drafts from committed slot fields only; fieldBound identity changes every parent render
  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (!fieldBound) {
      return;
    }
    setNameDraft(fieldBound.name);
    setLabelDraft(fieldBound.label);
    setFieldError(null);
  }, [node.id, exposeToEditors, fieldBound?.name, fieldBound?.label]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "Invalid editor field";
      setFieldError(msg);
      return;
    }
    setFieldError(null);
    setNodeEditorFieldBinding(parsed.data);
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
          checked={exposeToEditors}
          id={exposeId}
          onChange={(e) => {
            if (e.target.checked) {
              applyEditorField({
                name: "content",
                type: "text",
                required: false,
                label: "Content",
                defaultValue: content,
              });
            } else {
              setFieldError(null);
              setNodeEditorFieldBinding(null);
            }
          }}
        />
        <Label className="text-xs font-normal" htmlFor={exposeId}>
          Expose to CMS editors
        </Label>
      </div>
      {exposeToEditors && fieldBound ? (
        <div className="space-y-3 rounded-md border border-border/60 p-3">
          <div className="space-y-2">
            <Label
              className="text-xs text-muted-foreground"
              htmlFor={slotNameId}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8 text-xs"
              data-testid="inspector-slot-name"
              id={slotNameId}
              onBlur={() => {
                if (!fieldBound) {
                  return;
                }
                const trimmed = nameDraft.trim();
                applyEditorField({
                  ...fieldBound,
                  name: trimmed,
                });
              }}
              onChange={(e) => {
                setNameDraft(e.target.value);
                setFieldError(null);
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
                if (!fieldBound) {
                  return;
                }
                const label = labelDraft.trim() || "Content";
                applyEditorField({
                  ...fieldBound,
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => {
                setLabelDraft(e.target.value);
                setFieldError(null);
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
                const type = e.target.value as EditorFieldSpec["type"];
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  type,
                });
              }}
              value={fieldBound.type}
            >
              {EDITOR_FIELD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-req`}
              onChange={(e) => {
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
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
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  defaultValue: e.target.value,
                });
              }}
              type="text"
              value={
                typeof fieldBound.defaultValue === "string"
                  ? fieldBound.defaultValue
                  : ""
              }
            />
          </div>
          {fieldError ? (
            <p className="text-xs text-destructive" role="alert">
              {fieldError}
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
  onNodeStyleToken,
  patchNodeProps,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition | null;
  node: CompositionNode | null;
  onTextChange: (content: string) => void;
  onNodeStyleToken: (property: StyleProperty, token: string) => void;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
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
  const isSlot = node.definitionKey === "primitive.slot";
  const isLibraryComponent =
    node.definitionKey === "primitive.libraryComponent";

  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const backgroundStyle = readStyleProperty(composition, node, "background");
  const bgToken =
    backgroundStyle?.type === "token" ? backgroundStyle.token : "";

  const fieldBound =
    node.contentBinding?.source === "editor"
      ? node.contentBinding.editorField
      : undefined;
  const exposeToEditors = Boolean(fieldBound);

  return (
    <div className="space-y-4 text-sm">
      <div className="font-mono text-xs text-muted-foreground">
        {node.definitionKey}
      </div>
      {isText ? (
        <TextPrimitiveInspector
          content={content}
          exposeToEditors={exposeToEditors}
          node={node}
          onTextChange={onTextChange}
          setNodeEditorFieldBinding={setNodeEditorFieldBinding}
          fieldBound={fieldBound}
        />
      ) : null}
      {isStack ? (
        <div className="space-y-3 border-t border-border/60 pt-3">
          <div className="text-xs font-medium text-foreground">
            Props (stack)
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
      {isBox || isSlot ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-foreground">
            Background token
          </span>
          <input
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            data-testid={
              isSlot
                ? "inspector-slot-background-token"
                : "inspector-box-background-token"
            }
            onChange={(e) => onNodeStyleToken("background", e.target.value)}
            placeholder="color.surface.primary"
            type="text"
            value={bgToken}
          />
        </label>
      ) : null}
      {isSlot ? (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="text-xs font-medium text-foreground">Slot id</div>
          <Input
            data-testid="inspector-slot-id"
            onChange={(e) => patchNodeProps({ slotId: e.target.value })}
            placeholder="main"
            type="text"
            value={
              typeof node.propValues?.slotId === "string"
                ? node.propValues.slotId
                : ""
            }
          />
          <p className="text-[0.65rem] leading-snug text-muted-foreground">
            Editors assign blocks to this id via Layout slot on each block row.
            Use a unique id per slot in this template.
          </p>
        </div>
      ) : null}
      {isLibraryComponent ? (
        <div className="space-y-2 border-t border-border/60 pt-3">
          <div className="text-xs font-medium text-foreground">Component</div>
          <p className="text-[0.65rem] leading-snug text-muted-foreground">
            Pulled from Components. On the live site the published layout for
            this key is rendered here.
          </p>
          <div className="rounded-md border border-border bg-muted/30 px-2 py-1.5 font-mono text-xs text-foreground">
            {typeof node.propValues?.componentKey === "string"
              ? node.propValues.componentKey
              : "—"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
