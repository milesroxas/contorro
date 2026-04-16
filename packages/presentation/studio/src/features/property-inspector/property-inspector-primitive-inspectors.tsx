"use client";

import {
  type CompositionNode,
  EDITOR_FIELD_TYPES,
  type EditorFieldSpec,
  EditorFieldSpecSchema,
  type PageComposition,
} from "@repo/contracts-zod";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { ScrollArea } from "../../components/ui/scroll-area.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet.js";
import { fetchMediaRecords, type MediaListItem } from "../../lib/cms-media.js";
import { cn } from "../../lib/cn.js";
import {
  fetchPayloadCollectionDocs,
  type PayloadCollectionDocRef,
} from "../../lib/fetch-payload-collection-docs.js";
import { CollectionFieldBindingSection } from "./collection-field-binding-controls.js";
import {
  IMAGE_PRIMITIVE_MEDIA_KEYS,
  ImageSourcePayloadInspectorFields,
  parseMediaIdFromPropValues,
} from "./image-source-payload-inspector.js";
import { PayloadMediaPickerFields } from "./payload-media-picker-fields.js";
import {
  SettingsCheckboxFieldRow,
  SettingsFieldRow,
} from "./property-control-label.js";
import { isNodeCollectionFieldMapped } from "./property-inspector-node-meta.js";

async function fetchCollectionEntries(
  collectionSlug: string,
): Promise<PayloadCollectionDocRef[]> {
  const docs = await fetchPayloadCollectionDocs(collectionSlug);
  return docs.filter((doc) => doc.slug.length > 0);
}

export function TextPrimitiveInspector({
  composition,
  node,
  content,
  fieldBound,
  exposeToEditors,
  onTextChange,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  content: string;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  onTextChange: (content: string) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
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
  const committedName = fieldBound?.name;
  const committedLabel = fieldBound?.label;

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (committedName === undefined || committedLabel === undefined) {
      return;
    }
    setNameDraft(committedName);
    setLabelDraft(committedLabel);
    setFieldError(null);
  }, [committedLabel, committedName, exposeToEditors]);

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

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <>
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={exposeToEditors}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={contentId}
          label="Content"
          onResetProp={resetNodePropKey}
          propKey="content"
          propValues={node.propValues}
        >
          <Input
            data-testid="inspector-text-content"
            id={contentId}
            onChange={(e) => onTextChange(e.target.value)}
            type="text"
            value={content}
          />
        </SettingsFieldRow>
      )}
      {collectionMapped ? null : (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={exposeToEditors}
            disabled={node.contentBinding?.source === "collection"}
            id={exposeId}
            onCheckedChange={(v) => {
              if (v === true) {
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
          <Label className="text-sm font-normal" htmlFor={exposeId}>
            Expose to CMS editors
          </Label>
        </div>
      )}
      {collectionMapped ? null : exposeToEditors && fieldBound ? (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotNameId}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8"
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
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotLabelId}
            >
              Label
            </Label>
            <Input
              className="h-8"
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
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotTypeId}
            >
              Editor field type
            </Label>
            <Select
              onValueChange={(value) => {
                const type = value as EditorFieldSpec["type"];
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
              <SelectTrigger data-testid="inspector-slot-type" id={slotTypeId}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITOR_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-req`}
              onCheckedChange={(v) => {
                if (!fieldBound) {
                  return;
                }
                applyEditorField({
                  ...fieldBound,
                  required: v === true,
                });
              }}
            />
            <Label className="text-sm font-normal" htmlFor={`${baseId}-req`}>
              Required
            </Label>
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={slotDefaultId}
            >
              Default value
            </Label>
            <Input
              className="h-8"
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
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

export function HeadingPrimitiveInspector({
  composition,
  node,
  patchNodeProps,
  fieldBound,
  exposeToEditors,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const level =
    typeof node.propValues?.level === "string" &&
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.propValues.level)
      ? node.propValues.level
      : "h2";
  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const committedName = fieldBound?.name;
  const committedLabel = fieldBound?.label;

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      setFieldError(null);
      return;
    }
    if (committedName === undefined || committedLabel === undefined) {
      return;
    }
    setNameDraft(committedName);
    setLabelDraft(committedLabel);
    setFieldError(null);
  }, [committedLabel, committedName, exposeToEditors]);

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

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-5">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={exposeToEditors}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-heading-content`}
          label="Content"
          onResetProp={resetNodePropKey}
          propKey="content"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-heading-content`}
            onChange={(e) => patchNodeProps({ content: e.target.value })}
            type="text"
            value={content}
          />
        </SettingsFieldRow>
      )}
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-heading-level`}
        label="Heading level"
        onResetProp={resetNodePropKey}
        propKey="level"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) => patchNodeProps({ level: value })}
          value={level}
        >
          <SelectTrigger id={`${baseId}-heading-level`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="h1">H1</SelectItem>
            <SelectItem value="h2">H2</SelectItem>
            <SelectItem value="h3">H3</SelectItem>
            <SelectItem value="h4">H4</SelectItem>
            <SelectItem value="h5">H5</SelectItem>
            <SelectItem value="h6">H6</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      {collectionMapped ? null : (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={exposeToEditors}
            disabled={node.contentBinding?.source === "collection"}
            id={`${baseId}-heading-expose`}
            onCheckedChange={(v) => {
              if (v === true) {
                applyEditorField({
                  name: "heading",
                  type: "text",
                  required: false,
                  label: "Heading",
                  defaultValue: content,
                });
                return;
              }
              setFieldError(null);
              setNodeEditorFieldBinding(null);
            }}
          />
          <Label
            className="text-sm font-normal"
            htmlFor={`${baseId}-heading-expose`}
          >
            Expose to CMS editors
          </Label>
        </div>
      )}
      {collectionMapped ? null : exposeToEditors && fieldBound ? (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-name`}
            >
              Field name (kebab-case)
            </Label>
            <Input
              aria-invalid={Boolean(fieldError)}
              className="h-8"
              id={`${baseId}-heading-slot-name`}
              onBlur={() => {
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
              placeholder="hero-heading"
              spellCheck={false}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-label`}
            >
              Label
            </Label>
            <Input
              className="h-8"
              id={`${baseId}-heading-slot-label`}
              onBlur={() => {
                const label = labelDraft.trim() || "Heading";
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
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-type`}
            >
              Editor field type
            </Label>
            <Select
              onValueChange={(value) => {
                const type = value as EditorFieldSpec["type"];
                applyEditorField({
                  ...fieldBound,
                  type,
                });
              }}
              value={fieldBound.type}
            >
              <SelectTrigger
                data-testid="inspector-heading-slot-type"
                id={`${baseId}-heading-slot-type`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EDITOR_FIELD_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-heading-req`}
              onCheckedChange={(v) => {
                applyEditorField({
                  ...fieldBound,
                  required: v === true,
                });
              }}
            />
            <Label
              className="text-sm font-normal"
              htmlFor={`${baseId}-heading-req`}
            >
              Required
            </Label>
          </div>
          <div className="space-y-3">
            <Label
              className="text-sm text-muted-foreground"
              htmlFor={`${baseId}-heading-slot-default`}
            >
              Default value
            </Label>
            <Input
              className="h-8"
              id={`${baseId}-heading-slot-default`}
              onChange={(e) => {
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
            <p className="text-sm text-destructive" role="alert">
              {fieldError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ButtonPrimitivePayloadCollectionFields({
  baseId,
  collectionSlug,
  definitionKey,
  entries,
  entryLoadError,
  entryLoading,
  entryPickerOpen,
  entrySlug,
  nodePropValues,
  patchNodeProps,
  resetNodePropKey,
  setEntryPickerOpen,
}: {
  baseId: string;
  collectionSlug: string;
  definitionKey: string;
  entries: PayloadCollectionDocRef[];
  entryLoadError: string | null;
  entryLoading: boolean;
  entryPickerOpen: boolean;
  entrySlug: string;
  nodePropValues: CompositionNode["propValues"];
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setEntryPickerOpen: (open: boolean) => void;
}) {
  return (
    <>
      <SettingsFieldRow
        definitionKey={definitionKey}
        htmlFor={`${baseId}-button-collection`}
        label="Collection slug"
        onResetProp={resetNodePropKey}
        propKey="collectionSlug"
        propValues={nodePropValues}
      >
        <Input
          id={`${baseId}-button-collection`}
          onChange={(e) =>
            patchNodeProps({
              collectionSlug: e.target.value,
            })
          }
          placeholder="pages"
          type="text"
          value={collectionSlug}
        />
      </SettingsFieldRow>
      <SettingsFieldRow
        definitionKey={definitionKey}
        htmlFor={`${baseId}-button-entry`}
        label="Entry slug (optional)"
        onResetProp={resetNodePropKey}
        propKey="entrySlug"
        propValues={nodePropValues}
      >
        <div className="flex items-center gap-2">
          <Input
            id={`${baseId}-button-entry`}
            onChange={(e) =>
              patchNodeProps({
                entrySlug: e.target.value,
              })
            }
            placeholder="about"
            type="text"
            value={entrySlug}
          />
          <Sheet onOpenChange={setEntryPickerOpen} open={entryPickerOpen}>
            <SheetTrigger asChild>
              <Button
                disabled={!collectionSlug.trim()}
                size="sm"
                type="button"
                variant="ghost"
              >
                Browse
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>
                  Select {collectionSlug || "collection"} entry
                </SheetTitle>
                <SheetDescription>
                  Pick an entry and we will set its slug.
                </SheetDescription>
              </SheetHeader>
              <SheetBody>
                <ScrollArea className="min-h-0 flex-1">
                  <div className="space-y-2">
                    {entryLoading ? (
                      <p className="text-sm text-muted-foreground">Loading…</p>
                    ) : entryLoadError ? (
                      <p className="text-sm text-red-500">{entryLoadError}</p>
                    ) : entries.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No entries found.
                      </p>
                    ) : (
                      entries.map((entry) => (
                        <button
                          className="w-full rounded-md border border-border/60 p-2 text-left hover:bg-accent/50"
                          key={`${entry.id}-${entry.slug}`}
                          onClick={() => {
                            patchNodeProps({
                              collectionSlug: collectionSlug.trim(),
                              entrySlug: entry.slug,
                            });
                            setEntryPickerOpen(false);
                          }}
                          type="button"
                        >
                          <div className="text-sm font-medium">
                            {entry.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.slug}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="flex shrink-0 justify-end border-t border-border pt-3">
                  <SheetClose asChild>
                    <Button size="sm" type="button" variant="ghost">
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </SettingsFieldRow>
    </>
  );
}

export function ButtonPrimitiveInspector({
  composition,
  node,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
}) {
  const baseId = useId();
  const label =
    typeof node.propValues?.label === "string" ? node.propValues.label : "";
  const linkType =
    node.propValues?.linkType === "payloadCollection"
      ? "payloadCollection"
      : "url";
  const href =
    typeof node.propValues?.href === "string" ? node.propValues.href : "";
  const collectionSlug =
    typeof node.propValues?.collectionSlug === "string"
      ? node.propValues.collectionSlug
      : "";
  const entrySlug =
    typeof node.propValues?.entrySlug === "string"
      ? node.propValues.entrySlug
      : "";
  const openInNewTab = Boolean(node.propValues?.openInNewTab);
  const [entryPickerOpen, setEntryPickerOpen] = useState(false);
  const [entryLoading, setEntryLoading] = useState(false);
  const [entryLoadError, setEntryLoadError] = useState<string | null>(null);
  const [entries, setEntries] = useState<PayloadCollectionDocRef[]>([]);

  useEffect(() => {
    if (!entryPickerOpen || !collectionSlug.trim()) {
      return;
    }
    setEntryLoading(true);
    setEntryLoadError(null);
    void fetchCollectionEntries(collectionSlug)
      .then((docs) => {
        setEntries(docs);
      })
      .catch((err) => {
        setEntryLoadError(
          err instanceof Error ? err.message : "Failed to load entries",
        );
      })
      .finally(() => {
        setEntryLoading(false);
      });
  }, [collectionSlug, entryPickerOpen]);

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-4">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={false}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-button-label`}
          label="Label"
          onResetProp={resetNodePropKey}
          propKey="label"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-button-label`}
            onChange={(e) => patchNodeProps({ label: e.target.value })}
            type="text"
            value={label}
          />
        </SettingsFieldRow>
      )}
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-button-link-type`}
        label="Link source"
        onResetProp={resetNodePropKey}
        propKey="linkType"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) =>
            patchNodeProps({
              linkType: value,
            })
          }
          value={linkType}
        >
          <SelectTrigger id={`${baseId}-button-link-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="payloadCollection">
              Payload collection
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      {linkType === "url" ? (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-button-url`}
          label="URL"
          onResetProp={resetNodePropKey}
          propKey="href"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-button-url`}
            onChange={(e) => patchNodeProps({ href: e.target.value })}
            placeholder="https://"
            type="url"
            value={href}
          />
        </SettingsFieldRow>
      ) : (
        <ButtonPrimitivePayloadCollectionFields
          baseId={baseId}
          collectionSlug={collectionSlug}
          definitionKey={node.definitionKey}
          entries={entries}
          entryLoadError={entryLoadError}
          entryLoading={entryLoading}
          entryPickerOpen={entryPickerOpen}
          entrySlug={entrySlug}
          nodePropValues={node.propValues}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          setEntryPickerOpen={setEntryPickerOpen}
        />
      )}
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-button-new-tab`}
        checked={openInNewTab}
        definitionKey={node.definitionKey}
        label="Open in new tab"
        onCheckedChange={(next) => patchNodeProps({ openInNewTab: next })}
        onResetProp={resetNodePropKey}
        propKey="openInNewTab"
        propValues={node.propValues}
      />
    </div>
  );
}

function ImagePrimitiveInspectorAltAndBindingFields({
  applyEditorField,
  baseId,
  error,
  exposeToEditors,
  fieldBound,
  labelDraft,
  mediaId,
  nameDraft,
  node,
  patchNodeProps,
  resetNodePropKey,
  setLabelDraft,
  setNameDraft,
  setNodeEditorFieldBinding,
  alt,
}: {
  alt: string;
  applyEditorField: (next: EditorFieldSpec) => void;
  baseId: string;
  error: string | null;
  exposeToEditors: boolean;
  fieldBound: EditorFieldSpec | undefined;
  labelDraft: string;
  mediaId: number | "";
  nameDraft: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setLabelDraft: (value: string) => void;
  setNameDraft: (value: string) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  return (
    <>
      <div className="border-t border-border/60 pt-5">
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-image-alt`}
          label="Alt text"
          onResetProp={resetNodePropKey}
          propKey="alt"
          propValues={node.propValues}
        >
          <Input
            id={`${baseId}-image-alt`}
            onChange={(e) => patchNodeProps({ alt: e.target.value })}
            type="text"
            value={alt}
          />
        </SettingsFieldRow>
      </div>
      <div className="flex items-center gap-2.5 border-t border-border/60 pt-5">
        <Checkbox
          checked={exposeToEditors}
          disabled={node.contentBinding?.source === "collection"}
          id={`${baseId}-image-expose`}
          onCheckedChange={(v) => {
            if (v === true) {
              applyEditorField({
                name: "image",
                type: "image",
                required: false,
                label: "Image",
                defaultValue: mediaId === "" ? "" : mediaId,
              });
              return;
            }
            setNodeEditorFieldBinding(null);
          }}
        />
        <Label
          className="text-sm font-normal"
          htmlFor={`${baseId}-image-expose`}
        >
          Expose to CMS editors
        </Label>
      </div>
      {exposeToEditors && fieldBound ? (
        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <div className="space-y-3">
            <Label htmlFor={`${baseId}-image-slot-name`}>
              Field name (kebab-case)
            </Label>
            <Input
              id={`${baseId}-image-slot-name`}
              onBlur={() => {
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  name: nameDraft.trim(),
                });
              }}
              onChange={(e) => setNameDraft(e.target.value)}
              type="text"
              value={nameDraft}
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor={`${baseId}-image-slot-label`}>Label</Label>
            <Input
              id={`${baseId}-image-slot-label`}
              onBlur={() => {
                const label = labelDraft.trim() || "Image";
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  label,
                });
                setLabelDraft(label);
              }}
              onChange={(e) => setLabelDraft(e.target.value)}
              type="text"
              value={labelDraft}
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={fieldBound.required}
              id={`${baseId}-image-required`}
              onCheckedChange={(v) => {
                applyEditorField({
                  ...fieldBound,
                  type: "image",
                  required: v === true,
                });
              }}
            />
            <Label
              className="text-sm font-normal"
              htmlFor={`${baseId}-image-required`}
            >
              Required
            </Label>
          </div>
        </div>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}

export function ImagePrimitiveTailwindUtilitiesField({
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const baseId = useId();
  const value =
    typeof node.propValues?.imageUtilities === "string"
      ? node.propValues.imageUtilities
      : "";
  return (
    <div className="border-t border-border/60 pt-4">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-image-utilities`}
        label="Image utilities"
        onResetProp={resetNodePropKey}
        propKey="imageUtilities"
        propValues={node.propValues}
      >
        <textarea
          className={cn(
            "flex min-h-[4.5rem] w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
            "disabled:opacity-50",
          )}
          id={`${baseId}-image-utilities`}
          onChange={(e) => patchNodeProps({ imageUtilities: e.target.value })}
          placeholder="object-cover rounded-md …"
          spellCheck={false}
          value={value}
        />
      </SettingsFieldRow>
    </div>
  );
}

export function ImagePrimitiveInspector({
  composition,
  node,
  fieldBound,
  exposeToEditors,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
  setNodeEditorFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  fieldBound: EditorFieldSpec | undefined;
  exposeToEditors: boolean;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const alt =
    typeof node.propValues?.alt === "string" ? node.propValues.alt : "";
  const mediaId = parseMediaIdFromPropValues(node.propValues, "mediaId");
  const [error, setError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState(() => fieldBound?.name ?? "");
  const [labelDraft, setLabelDraft] = useState(() => fieldBound?.label ?? "");
  const committedName = fieldBound?.name;
  const committedLabel = fieldBound?.label;

  useEffect(() => {
    if (!exposeToEditors) {
      setNameDraft("");
      setLabelDraft("");
      return;
    }
    if (committedName === undefined || committedLabel === undefined) {
      return;
    }
    setNameDraft(committedName);
    setLabelDraft(committedLabel);
  }, [committedLabel, committedName, exposeToEditors]);

  function applyEditorField(next: EditorFieldSpec) {
    const parsed = EditorFieldSpecSchema.safeParse(next);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid editor field");
      return;
    }
    setError(null);
    setNodeEditorFieldBinding(parsed.data);
  }

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-6">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={exposeToEditors}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <>
          <ImageSourcePayloadInspectorFields
            altForUpload={alt}
            altValueKey="alt"
            baseId={baseId}
            definitionKey={node.definitionKey}
            keys={IMAGE_PRIMITIVE_MEDIA_KEYS}
            node={node}
            patchNodeProps={patchNodeProps}
            resetNodePropKey={resetNodePropKey}
            setError={setError}
            urlFieldLabel="Image URL"
          />
          <ImagePrimitiveInspectorAltAndBindingFields
            alt={alt}
            applyEditorField={applyEditorField}
            baseId={baseId}
            error={error}
            exposeToEditors={exposeToEditors}
            fieldBound={fieldBound}
            labelDraft={labelDraft}
            mediaId={mediaId}
            nameDraft={nameDraft}
            node={node}
            patchNodeProps={patchNodeProps}
            resetNodePropKey={resetNodePropKey}
            setLabelDraft={setLabelDraft}
            setNameDraft={setNameDraft}
            setNodeEditorFieldBinding={setNodeEditorFieldBinding}
          />
        </>
      )}
    </div>
  );
}

function VideoPrimitiveInspectorUrlFields({
  baseId,
  node,
  patchNodeProps,
  resetNodePropKey,
  src,
}: {
  baseId: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  src: string;
}) {
  return (
    <div className="min-w-0 space-y-3 border-t border-border/60 pt-5">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-url`}
        label="Video URL"
        onResetProp={resetNodePropKey}
        propKey="src"
        propValues={node.propValues}
      >
        <Input
          id={`${baseId}-video-url`}
          onChange={(e) =>
            patchNodeProps({
              src: e.target.value,
              videoSource: "url",
            })
          }
          placeholder="https://"
          type="url"
          value={src}
        />
      </SettingsFieldRow>
    </div>
  );
}

function VideoPrimitivePlaybackFields({
  baseId,
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  baseId: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const poster =
    typeof node.propValues?.poster === "string" ? node.propValues.poster : "";
  const objectFitRaw = node.propValues?.objectFit;
  const objectFit =
    typeof objectFitRaw === "string" && objectFitRaw.length > 0
      ? objectFitRaw
      : "cover";
  const preloadRaw = node.propValues?.preload;
  const preload =
    typeof preloadRaw === "string" && preloadRaw.length > 0
      ? preloadRaw
      : "metadata";
  const autoPlay = Boolean(node.propValues?.autoPlay);
  const loop = Boolean(node.propValues?.loop);
  const muted = Boolean(node.propValues?.muted);
  const playsInline = node.propValues?.playsInline !== false;
  const controls = node.propValues?.controls !== false;

  return (
    <div className="min-w-0 space-y-5 border-t border-border/60 pt-5">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-poster`}
        label="Poster image URL"
        onResetProp={resetNodePropKey}
        propKey="poster"
        propValues={node.propValues}
      >
        <Input
          id={`${baseId}-video-poster`}
          onChange={(e) => patchNodeProps({ poster: e.target.value })}
          placeholder="https://"
          type="url"
          value={poster}
        />
      </SettingsFieldRow>
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-object-fit`}
        label="Object fit"
        onResetProp={resetNodePropKey}
        propKey="objectFit"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) => patchNodeProps({ objectFit: value })}
          value={objectFit}
        >
          <SelectTrigger id={`${baseId}-video-object-fit`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">Cover</SelectItem>
            <SelectItem value="contain">Contain</SelectItem>
            <SelectItem value="fill">Fill</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-video-preload`}
        label="Preload"
        onResetProp={resetNodePropKey}
        propKey="preload"
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) => patchNodeProps({ preload: value })}
          value={preload}
        >
          <SelectTrigger id={`${baseId}-video-preload`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="metadata">Metadata</SelectItem>
            <SelectItem value="auto">Auto</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-autoplay`}
        checked={autoPlay}
        definitionKey={node.definitionKey}
        label="Autoplay"
        onCheckedChange={(next) => patchNodeProps({ autoPlay: next })}
        onResetProp={resetNodePropKey}
        propKey="autoPlay"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-loop`}
        checked={loop}
        definitionKey={node.definitionKey}
        label="Loop"
        onCheckedChange={(next) => patchNodeProps({ loop: next })}
        onResetProp={resetNodePropKey}
        propKey="loop"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-muted`}
        checked={muted}
        definitionKey={node.definitionKey}
        label="Muted"
        onCheckedChange={(next) => patchNodeProps({ muted: next })}
        onResetProp={resetNodePropKey}
        propKey="muted"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-playsinline`}
        checked={playsInline}
        definitionKey={node.definitionKey}
        label="Plays inline"
        onCheckedChange={(next) => patchNodeProps({ playsInline: next })}
        onResetProp={resetNodePropKey}
        propKey="playsInline"
        propValues={node.propValues}
      />
      <SettingsCheckboxFieldRow
        checkboxId={`${baseId}-video-controls`}
        checked={controls}
        definitionKey={node.definitionKey}
        label="Show controls"
        onCheckedChange={(next) => patchNodeProps({ controls: next })}
        onResetProp={resetNodePropKey}
        propKey="controls"
        propValues={node.propValues}
      />
    </div>
  );
}

export function VideoPrimitiveInspector({
  composition,
  node,
  patchNodeProps,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
}) {
  const baseId = useId();
  const videoSource = node.propValues?.videoSource === "url" ? "url" : "media";
  const src =
    typeof node.propValues?.src === "string" ? node.propValues.src : "";
  const mediaId =
    typeof node.propValues?.mediaId === "number"
      ? node.propValues.mediaId
      : typeof node.propValues?.mediaId === "string" &&
          /^\d+$/.test(node.propValues.mediaId)
        ? Number.parseInt(node.propValues.mediaId, 10)
        : "";
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [mediaDocs, setMediaDocs] = useState<MediaListItem[]>([]);

  useEffect(() => {
    if (!mediaPickerOpen) {
      return;
    }
    setMediaLoading(true);
    setMediaLoadError(null);
    void fetchMediaRecords()
      .then((docs) => {
        setMediaDocs(docs);
      })
      .catch((err) => {
        setMediaLoadError(
          err instanceof Error ? err.message : "Failed to load media entries",
        );
      })
      .finally(() => {
        setMediaLoading(false);
      });
  }, [mediaPickerOpen]);

  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="min-w-0 space-y-6">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={false}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <>
          <SettingsFieldRow
            definitionKey={node.definitionKey}
            htmlFor={`${baseId}-video-source`}
            label="Source"
            onResetProp={resetNodePropKey}
            propKey="videoSource"
            propValues={node.propValues}
          >
            <Select
              onValueChange={(value) =>
                patchNodeProps({
                  videoSource: value,
                })
              }
              value={videoSource}
            >
              <SelectTrigger id={`${baseId}-video-source`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="media">Payload Media</SelectItem>
              </SelectContent>
            </Select>
          </SettingsFieldRow>
          {videoSource === "url" ? (
            <VideoPrimitiveInspectorUrlFields
              baseId={baseId}
              node={node}
              patchNodeProps={patchNodeProps}
              resetNodePropKey={resetNodePropKey}
              src={src}
            />
          ) : (
            <PayloadMediaPickerFields
              altForUpload=""
              baseId={baseId}
              busy={busy}
              mediaDocs={mediaDocs}
              mediaId={mediaId}
              mediaLoadError={mediaLoadError}
              mediaLoading={mediaLoading}
              mediaPickerOpen={mediaPickerOpen}
              onSelectMediaDoc={(media) =>
                patchNodeProps({
                  videoSource: "media",
                  mediaId: media.id,
                  src: media.url,
                  mediaUrl: media.url,
                })
              }
              onUploadComplete={(media) =>
                patchNodeProps({
                  videoSource: "media",
                  mediaId: media.id,
                  src: media.url,
                  mediaUrl: media.url,
                })
              }
              setBusy={setBusy}
              setError={setError}
              setMediaPickerOpen={setMediaPickerOpen}
              src={src}
              uploadInputRef={uploadInputRef}
              variant="video"
            />
          )}
        </>
      )}
      <VideoPrimitivePlaybackFields
        baseId={baseId}
        node={node}
        patchNodeProps={patchNodeProps}
        resetNodePropKey={resetNodePropKey}
      />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
