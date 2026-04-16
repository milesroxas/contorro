"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { Input } from "../../components/ui/input.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { fetchMediaRecords, type MediaListItem } from "../../lib/cms-media.js";
import { PayloadMediaPickerFields } from "./payload-media-picker-fields.js";
import { SettingsFieldRow } from "./property-control-label.js";

export type ImageSourcePayloadKeyMap = {
  mediaId: string;
  mediaUrl: string;
  source: string;
  src: string;
};

/** Keys aligned with {@link resolvedPrimitiveMediaSrc} (`src` + `mediaUrl`). */
export const IMAGE_PRIMITIVE_MEDIA_KEYS: ImageSourcePayloadKeyMap = {
  source: "imageSource",
  src: "src",
  mediaId: "mediaId",
  mediaUrl: "mediaUrl",
};

/** Keys aligned with {@link resolvedPrefixedMediaSrc} for box background. */
export const BOX_BACKGROUND_IMAGE_MEDIA_KEYS: ImageSourcePayloadKeyMap = {
  source: "backgroundImageSource",
  src: "backgroundImageSrc",
  mediaId: "backgroundImageMediaId",
  mediaUrl: "backgroundImageMediaUrl",
};

export function parseMediaIdFromPropValues(
  propValues: CompositionNode["propValues"],
  mediaIdKey: string,
): number | "" {
  if (!propValues) {
    return "";
  }
  const raw = propValues[mediaIdKey];
  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw) && raw.trim().length > 0) {
    return Number.parseInt(raw, 10);
  }
  return "";
}

export function usePayloadMediaPickerSession(): {
  busy: boolean;
  mediaDocs: MediaListItem[];
  mediaLoadError: string | null;
  mediaLoading: boolean;
  mediaPickerOpen: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setMediaPickerOpen: Dispatch<SetStateAction<boolean>>;
  uploadInputRef: RefObject<HTMLInputElement | null>;
} {
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
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

  return {
    busy,
    mediaDocs,
    mediaLoadError,
    mediaLoading,
    mediaPickerOpen,
    setBusy,
    setMediaPickerOpen,
    uploadInputRef,
  };
}

function ImageSourceUrlFieldRow({
  baseId,
  definitionKey,
  keys,
  node,
  patchNodeProps,
  resetNodePropKey,
  src,
  urlFieldLabel,
}: {
  baseId: string;
  definitionKey: string;
  keys: ImageSourcePayloadKeyMap;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  src: string;
  urlFieldLabel: string;
}) {
  return (
    <div className="space-y-3 border-t border-border/60 pt-5">
      <SettingsFieldRow
        definitionKey={definitionKey}
        htmlFor={`${baseId}-image-url`}
        label={urlFieldLabel}
        onResetProp={resetNodePropKey}
        propKey={keys.src}
        propValues={node.propValues}
      >
        <Input
          id={`${baseId}-image-url`}
          onChange={(e) =>
            patchNodeProps({
              [keys.src]: e.target.value,
              [keys.source]: "url",
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

export function ImageSourcePayloadInspectorFields({
  altForUpload,
  altValueKey,
  baseId,
  definitionKey,
  keys,
  node,
  patchNodeProps,
  resetNodePropKey,
  setError,
  urlFieldLabel,
}: {
  altForUpload: string;
  altValueKey: "alt" | "backgroundImageAlt";
  baseId: string;
  definitionKey: string;
  keys: ImageSourcePayloadKeyMap;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  setError: Dispatch<SetStateAction<string | null>>;
  urlFieldLabel: string;
}) {
  const sourceRaw = node.propValues?.[keys.source];
  const imageSource = sourceRaw === "url" ? "url" : "media";
  const rawSrc = node.propValues?.[keys.src];
  const src = typeof rawSrc === "string" ? rawSrc : "";
  const mediaId = parseMediaIdFromPropValues(node.propValues, keys.mediaId);

  const {
    busy,
    mediaDocs,
    mediaLoadError,
    mediaLoading,
    mediaPickerOpen,
    setBusy,
    setMediaPickerOpen,
    uploadInputRef,
  } = usePayloadMediaPickerSession();

  return (
    <>
      <SettingsFieldRow
        definitionKey={definitionKey}
        htmlFor={`${baseId}-image-source`}
        label="Source"
        onResetProp={resetNodePropKey}
        propKey={keys.source}
        propValues={node.propValues}
      >
        <Select
          onValueChange={(value) =>
            patchNodeProps({
              [keys.source]: value,
            })
          }
          value={imageSource}
        >
          <SelectTrigger id={`${baseId}-image-source`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="media">Payload Media</SelectItem>
          </SelectContent>
        </Select>
      </SettingsFieldRow>
      {imageSource === "url" ? (
        <ImageSourceUrlFieldRow
          baseId={baseId}
          definitionKey={definitionKey}
          keys={keys}
          node={node}
          patchNodeProps={patchNodeProps}
          resetNodePropKey={resetNodePropKey}
          src={src}
          urlFieldLabel={urlFieldLabel}
        />
      ) : (
        <PayloadMediaPickerFields
          altForUpload={altForUpload}
          baseId={baseId}
          busy={busy}
          mediaDocs={mediaDocs}
          mediaId={mediaId}
          mediaLoadError={mediaLoadError}
          mediaLoading={mediaLoading}
          mediaPickerOpen={mediaPickerOpen}
          onSelectMediaDoc={(media) =>
            patchNodeProps({
              [keys.source]: "media",
              [keys.mediaId]: media.id,
              [keys.src]: media.url,
              [keys.mediaUrl]: media.url,
              [altValueKey]: media.alt || altForUpload,
            })
          }
          onUploadComplete={(media, file) =>
            patchNodeProps({
              [keys.source]: "media",
              [keys.mediaId]: media.id,
              [keys.src]: media.url,
              [keys.mediaUrl]: media.url,
              [altValueKey]: media.alt || altForUpload || file.name,
            })
          }
          setBusy={setBusy}
          setError={setError}
          setMediaPickerOpen={setMediaPickerOpen}
          src={src}
          uploadInputRef={uploadInputRef}
          variant="image"
        />
      )}
    </>
  );
}
