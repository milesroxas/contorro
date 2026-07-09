"use client";

import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
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
import { cn } from "../../lib/cn.js";
import {
  fetchPayloadCollectionDocs,
  type PayloadCollectionDocRef,
} from "../../lib/fetch-payload-collection-docs.js";
import {
  fetchMediaRecords,
  type MediaListItem,
} from "../../lib/payload-media-client/index.js";
import { CollectionFieldBindingSection } from "./collection-field-binding-controls.js";
import {
  IMAGE_PRIMITIVE_MEDIA_KEYS,
  ImageSourcePayloadInspectorFields,
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

function isEditorFieldBound(node: CompositionNode): boolean {
  return node.contentBinding?.source === "editor";
}

export function TextPrimitiveInspector({
  composition,
  node,
  content,
  onTextChange,
  resetNodePropKey,
  setNodeCollectionFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  content: string;
  onTextChange: (content: string) => void;
  resetNodePropKey: (propKey: string) => void;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
}) {
  const baseId = useId();
  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <>
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={isEditorFieldBound(node)}
        node={node}
        setNodeCollectionFieldBinding={setNodeCollectionFieldBinding}
      />
      {collectionMapped ? null : (
        <SettingsFieldRow
          definitionKey={node.definitionKey}
          htmlFor={`${baseId}-content`}
          label="Content"
          onResetProp={resetNodePropKey}
          propKey="content"
          propValues={node.propValues}
        >
          <Input
            data-testid="inspector-text-content"
            id={`${baseId}-content`}
            onChange={(e) => onTextChange(e.target.value)}
            type="text"
            value={content}
          />
        </SettingsFieldRow>
      )}
    </>
  );
}

export function HeadingPrimitiveInspector({
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
  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const level =
    typeof node.propValues?.level === "string" &&
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(node.propValues.level)
      ? node.propValues.level
      : "h2";
  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-4">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={isEditorFieldBound(node)}
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
        <div className="flex items-center gap-1.5">
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
                  <div className="space-y-1.5">
                    {entryLoading ? (
                      <p className="text-xs text-muted-foreground">Loading…</p>
                    ) : entryLoadError ? (
                      <p className="text-xs text-red-500">{entryLoadError}</p>
                    ) : entries.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
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
                          <div className="text-xs font-medium">
                            {entry.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {entry.slug}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="flex shrink-0 justify-end border-t border-border pt-2">
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
    <div className="space-y-3">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={isEditorFieldBound(node)}
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
    <div className="border-t border-border/60 pt-3">
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
            "flex min-h-[4.5rem] w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm transition-[color,box-shadow] outline-none",
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
  const alt =
    typeof node.propValues?.alt === "string" ? node.propValues.alt : "";
  const [error, setError] = useState<string | null>(null);
  const collectionMapped = isNodeCollectionFieldMapped(node);

  return (
    <div className="space-y-4">
      <CollectionFieldBindingSection
        composition={composition}
        editorFieldBindingActive={isEditorFieldBound(node)}
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
          <div className="border-t border-border/60 pt-4">
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
          {error ? (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          ) : null}
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
    <div className="min-w-0 space-y-2 border-t border-border/60 pt-4">
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
    <div className="min-w-0 space-y-4 border-t border-border/60 pt-4">
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
    <div className="min-w-0 space-y-4">
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
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
