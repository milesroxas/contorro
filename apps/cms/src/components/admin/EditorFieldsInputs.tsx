"use client";

import type { EditorFieldSpec } from "@repo/contracts-zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  IconPhoto,
  IconPhotoOff,
  IconSearch,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

type Props = {
  fields: EditorFieldSpec[];
  current: Record<string, unknown>;
  patchField: (name: string, next: unknown) => void;
  /** Form processing / initializing — matches Payload field disabled state. */
  disabled?: boolean;
};

type MediaRecord = {
  id: number;
  url: string;
  alt: string;
};

type MediaListItem = {
  id: number;
  url: string;
  alt: string;
  filename?: string;
};

function toMediaListItem(value: {
  id?: unknown;
  url?: unknown;
  alt?: unknown;
  filename?: unknown;
}): MediaListItem | null {
  const id = typeof value.id === "number" ? value.id : Number.NaN;
  const url = typeof value.url === "string" ? value.url : "";
  if (!Number.isFinite(id) || url.length === 0) {
    return null;
  }
  return {
    id,
    url,
    alt: typeof value.alt === "string" ? value.alt : "",
    filename: typeof value.filename === "string" ? value.filename : "",
  };
}

function coerceMediaId(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return null;
}

async function uploadMediaFile(file: File, alt: string): Promise<MediaRecord> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("_payload", JSON.stringify({ alt: alt.trim() || file.name }));
  const res = await fetch("/api/media", {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`);
  }
  const json = (await res.json()) as {
    doc?: { id?: unknown; url?: unknown; alt?: unknown };
    id?: unknown;
    url?: unknown;
    alt?: unknown;
  };
  const doc =
    json.doc && typeof json.doc === "object" && !Array.isArray(json.doc)
      ? json.doc
      : json;
  if (typeof doc.id !== "number" || typeof doc.url !== "string") {
    throw new Error("Invalid upload response");
  }
  return {
    id: doc.id,
    url: doc.url,
    alt: typeof doc.alt === "string" ? doc.alt : "",
  };
}

async function fetchMediaRecords(): Promise<MediaListItem[]> {
  const res = await fetch("/api/media?depth=0&limit=50&sort=-updatedAt", {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(`Failed to load media (${res.status})`);
  }
  const json = (await res.json()) as {
    docs?: Array<{
      id?: unknown;
      url?: unknown;
      alt?: unknown;
      filename?: unknown;
    }>;
  };
  const docs = Array.isArray(json.docs) ? json.docs : [];
  return docs
    .map((doc) => toMediaListItem(doc))
    .filter((doc): doc is MediaListItem => doc !== null);
}

async function fetchMediaRecordById(
  mediaId: number,
): Promise<MediaListItem | null> {
  const res = await fetch(`/api/media/${mediaId}?depth=0`, {
    credentials: "include",
  });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load selected media (${res.status})`);
  }
  const json = (await res.json()) as {
    doc?: {
      id?: unknown;
      url?: unknown;
      alt?: unknown;
      filename?: unknown;
    };
    id?: unknown;
    url?: unknown;
    alt?: unknown;
    filename?: unknown;
  };
  const doc =
    json.doc && typeof json.doc === "object" && !Array.isArray(json.doc)
      ? json.doc
      : json;
  return toMediaListItem(doc);
}

function RequiredMark() {
  return (
    <span aria-hidden className="text-destructive">
      {" "}
      *
    </span>
  );
}

type FieldHeaderProps = {
  id: string;
  label: string;
  desc?: string;
  required: boolean;
  fieldType: EditorFieldSpec["type"];
};

const fieldStyles = {
  row: "space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 sm:p-5",
  fieldHeaderRow: "flex flex-wrap items-center justify-between gap-2",
  label: "font-semibold leading-snug tracking-tight text-foreground",
  typeBadge:
    "inline-flex items-center rounded-full border border-border/60 bg-muted/45 px-2 py-0.5 text-[10px] font-semibold tracking-[0.08em] uppercase text-muted-foreground",
  description: "leading-relaxed text-muted-foreground",
  error: "font-medium text-destructive",
  imageFieldPanel:
    "max-w-5xl rounded-xl border border-border/70 bg-background/75 p-4 sm:p-5",
  imageLayout: "grid gap-3 lg:grid-cols-[minmax(0,1fr)_17rem]",
  mediaList: "space-y-2 py-2 pr-2",
  mediaButton:
    "h-auto! w-full justify-start rounded-md border border-border/70 bg-background px-2.5 py-2 text-left hover:bg-muted/50",
  mediaButtonBody: "flex w-full min-w-0 items-center gap-2.5",
  mediaButtonThumb:
    "size-11 shrink-0 overflow-hidden rounded-sm border border-border/60 bg-muted/20",
  mediaButtonMeta: "min-w-0 space-y-0.5",
  selectedImageCard:
    "w-full overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
  selectedImageTopBar:
    "absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-2 bg-gradient-to-b from-background/95 via-background/70 to-transparent px-3 py-3",
  selectedImageTopBarTitle:
    "text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground",
  selectedImageEmpty:
    "flex h-full min-h-72 flex-col items-center justify-center gap-2 px-4 pt-16 pb-8 text-center text-muted-foreground",
  selectedImageFrame:
    "relative h-72 w-full overflow-hidden bg-gradient-to-br from-background to-muted/25",
  selectedImageFrameActive: "ring-2 ring-primary/45 ring-inset",
  selectedImageMedia: "h-full w-full object-contain p-4 pt-14 pb-6",
  selectedImageBody:
    "flex min-w-0 flex-wrap items-start justify-between gap-3 border-t border-border/60 bg-background/75 p-3.5 sm:flex-nowrap sm:items-end",
  selectedImageMeta: "grid min-w-0 flex-1 gap-1",
  selectedImageMetaLabel: "truncate font-semibold text-foreground/95",
  selectedImageMetaSubtle: "truncate text-xs text-muted-foreground",
  imageUploadRail:
    "flex min-h-72 flex-col gap-3 rounded-xl border border-border/70 bg-background/90 p-3.5",
  imageUploadRailHeading:
    "text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground",
  imageUploadRailText: "text-xs leading-relaxed text-muted-foreground",
  imageUploadRailStatus:
    "mt-auto flex min-w-0 items-center gap-2 text-xs text-muted-foreground",
} as const;

function fieldTypeLabel(fieldType: EditorFieldSpec["type"]): string {
  if (fieldType === "richText") {
    return "Rich text";
  }
  if (fieldType === "boolean") {
    return "Toggle";
  }
  return fieldType;
}

function FieldHeader({
  id,
  label,
  desc,
  required,
  fieldType,
}: FieldHeaderProps) {
  return (
    <>
      <div className={fieldStyles.fieldHeaderRow}>
        <Label className={fieldStyles.label} htmlFor={id}>
          {label}
          {required ? <RequiredMark /> : null}
        </Label>
        <span className={fieldStyles.typeBadge}>
          {fieldTypeLabel(fieldType)}
        </span>
      </div>
      {desc ? <p className={fieldStyles.description}>{desc}</p> : null}
    </>
  );
}

type MediaPickerListProps = {
  mediaDocs: MediaListItem[];
  mediaLoadError: string | null;
  mediaLoading: boolean;
  onPick: (mediaId: number) => void;
};

function MediaPickerList({
  mediaDocs,
  mediaLoadError,
  mediaLoading,
  onPick,
}: MediaPickerListProps) {
  if (mediaLoading) {
    return <p className={fieldStyles.description}>Loading...</p>;
  }
  if (mediaLoadError) {
    return <p className={fieldStyles.error}>{mediaLoadError}</p>;
  }
  if (mediaDocs.length === 0) {
    return <p className={fieldStyles.description}>No media entries found.</p>;
  }
  return (
    <>
      {mediaDocs.map((media) => (
        <Button
          className={fieldStyles.mediaButton}
          key={media.id}
          onClick={() => onPick(media.id)}
          type="button"
          variant="ghost"
        >
          <span className={fieldStyles.mediaButtonBody}>
            <span className={fieldStyles.mediaButtonThumb}>
              <img
                alt={media.alt || media.filename || "Media thumbnail"}
                className="h-full w-full object-cover"
                loading="lazy"
                src={media.url}
              />
            </span>
            <span className={fieldStyles.mediaButtonMeta}>
              <span className="block truncate font-medium text-foreground">
                {media.alt || media.filename || media.url}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {media.filename
                  ? `${media.filename} · ID ${media.id}`
                  : `ID ${media.id}`}
              </span>
            </span>
          </span>
        </Button>
      ))}
    </>
  );
}

type HandleImageUploadSelectionArgs = {
  file: File;
  fieldName: string;
  patchField: Props["patchField"];
  setImageBusy: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setImageError: React.Dispatch<
    React.SetStateAction<Record<string, string | null>>
  >;
  clearInput: () => void;
};

function handleImageUploadSelection({
  file,
  fieldName,
  patchField,
  setImageBusy,
  setImageError,
  clearInput,
}: HandleImageUploadSelectionArgs): void {
  setImageBusy((prev) => ({ ...prev, [fieldName]: true }));
  setImageError((prev) => ({ ...prev, [fieldName]: null }));
  void uploadMediaFile(file, file.name)
    .then((media) => {
      patchField(fieldName, media.id);
    })
    .catch((err) => {
      setImageError((prev) => ({
        ...prev,
        [fieldName]: err instanceof Error ? err.message : "Upload failed",
      }));
    })
    .finally(() => {
      setImageBusy((prev) => ({ ...prev, [fieldName]: false }));
      clearInput();
    });
}

type ImageFieldBlockProps = {
  field: EditorFieldSpec;
  v: unknown;
  id: string;
  label: string;
  desc?: string;
  disabled: boolean;
  patchField: Props["patchField"];
  imageBusy: Record<string, boolean>;
  setImageBusy: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  imageError: Record<string, string | null>;
  setImageError: React.Dispatch<
    React.SetStateAction<Record<string, string | null>>
  >;
  mediaPickerField: string | null;
  setMediaPickerField: React.Dispatch<React.SetStateAction<string | null>>;
  mediaPickerOpen: boolean;
  setMediaPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  mediaDocs: MediaListItem[];
  mediaLoading: boolean;
  mediaLoadError: string | null;
};

type SelectedImagePreviewProps = {
  mediaId: number | null;
  selectedMediaLoading: boolean;
  selectedMedia: MediaListItem | null;
  selectedMediaError: string | null;
  disabled: boolean;
  dropTargetActive: boolean;
  libraryControl: ReactNode;
  isUploading: boolean;
  onDragLeave: () => void;
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onClear: () => void;
};

type SelectedImageStageState = "empty" | "loading" | "error" | "ready";

type SelectedImageMeta = {
  title: string;
  subtle: string;
  idText: string | null;
  urlText: string | null;
};

function resolveSelectedImageStageState(
  mediaId: number | null,
  selectedMediaLoading: boolean,
  selectedMedia: MediaListItem | null,
): SelectedImageStageState {
  if (mediaId == null) {
    return "empty";
  }
  if (selectedMediaLoading) {
    return "loading";
  }
  if (!selectedMedia) {
    return "error";
  }
  return "ready";
}

function resolveSelectedImageMeta(
  selectedMedia: MediaListItem | null,
): SelectedImageMeta {
  if (!selectedMedia) {
    return {
      title: "No image selected",
      subtle: "PNG, JPG, WEBP or GIF",
      idText: null,
      urlText: null,
    };
  }
  return {
    title: selectedMedia.alt || selectedMedia.filename || "Selected image",
    subtle: selectedMedia.filename || "Payload media",
    idText: `ID ${selectedMedia.id}`,
    urlText: selectedMedia.url,
  };
}

function SelectedImageStage({
  state,
  selectedMedia,
  selectedMediaError,
}: {
  state: SelectedImageStageState;
  selectedMedia: MediaListItem | null;
  selectedMediaError: string | null;
}) {
  if (state === "empty") {
    return (
      <div className={fieldStyles.selectedImageEmpty}>
        <IconPhotoOff aria-hidden className="size-8" />
        <p className="font-medium text-foreground">
          Drop image into this canvas
        </p>
        <p>You can also open the library from the top-right corner.</p>
      </div>
    );
  }
  if (state === "loading") {
    return (
      <div className={fieldStyles.selectedImageEmpty}>
        <IconPhoto aria-hidden className="size-7" />
        <p>Loading selected image...</p>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className={fieldStyles.selectedImageEmpty}>
        <p className={fieldStyles.error}>
          {selectedMediaError || "Selected image could not be loaded."}
        </p>
      </div>
    );
  }
  if (!selectedMedia) {
    return null;
  }
  return (
    <img
      alt={selectedMedia.alt || "Selected image"}
      className={fieldStyles.selectedImageMedia}
      src={selectedMedia.url}
    />
  );
}

function SelectedImagePreview({
  mediaId,
  selectedMediaLoading,
  selectedMedia,
  selectedMediaError,
  disabled,
  dropTargetActive,
  libraryControl,
  isUploading,
  onDragLeave,
  onDragOver,
  onDrop,
  onClear,
}: SelectedImagePreviewProps) {
  const stageState = resolveSelectedImageStageState(
    mediaId,
    selectedMediaLoading,
    selectedMedia,
  );
  const hasSelectedMedia = stageState === "ready";
  const meta = resolveSelectedImageMeta(
    hasSelectedMedia ? selectedMedia : null,
  );

  return (
    <div className={fieldStyles.selectedImageCard}>
      <div
        className={cn(
          fieldStyles.selectedImageFrame,
          dropTargetActive && fieldStyles.selectedImageFrameActive,
          disabled && "opacity-70",
        )}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className={fieldStyles.selectedImageTopBar}>
          <span className={fieldStyles.selectedImageTopBarTitle}>
            {hasSelectedMedia ? "Preview canvas" : "Dropzone canvas"}
          </span>
          {libraryControl}
        </div>
        <SelectedImageStage
          selectedMedia={selectedMedia}
          selectedMediaError={selectedMediaError}
          state={stageState}
        />
      </div>
      <div className={fieldStyles.selectedImageBody}>
        <span className={fieldStyles.selectedImageMeta}>
          <span className={fieldStyles.selectedImageMetaLabel}>
            {meta.title}
          </span>
          <span className={fieldStyles.selectedImageMetaSubtle}>
            {meta.subtle}
          </span>
          {meta.idText ? (
            <span className={fieldStyles.selectedImageMetaSubtle}>
              {meta.idText}
            </span>
          ) : null}
          {meta.urlText ? (
            <span className={fieldStyles.selectedImageMetaSubtle}>
              {meta.urlText}
            </span>
          ) : null}
        </span>
        {hasSelectedMedia ? (
          <Button
            disabled={disabled || isUploading}
            onClick={onClear}
            size="fieldCompact"
            type="button"
            variant="outline"
          >
            <IconX aria-hidden className="size-3.5" />
            Clear image
          </Button>
        ) : (
          <span className={fieldStyles.selectedImageMetaSubtle}>
            Drag and drop supported.
          </span>
        )}
      </div>
    </div>
  );
}

function EditorImageFieldBlock({
  field,
  v,
  id,
  label,
  desc,
  disabled,
  patchField,
  imageBusy,
  setImageBusy,
  imageError,
  setImageError,
  mediaPickerField,
  setMediaPickerField,
  mediaPickerOpen,
  setMediaPickerOpen,
  mediaDocs,
  mediaLoading,
  mediaLoadError,
}: ImageFieldBlockProps) {
  const isUploading = imageBusy[field.name] === true;
  const mediaId = coerceMediaId(v);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [dropTargetActive, setDropTargetActive] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaListItem | null>(
    null,
  );
  const [selectedMediaLoading, setSelectedMediaLoading] = useState(false);
  const [selectedMediaError, setSelectedMediaError] = useState<string | null>(
    null,
  );
  const uploadDisabled = disabled || isUploading;

  useEffect(() => {
    if (mediaId == null) {
      setSelectedMedia(null);
      setSelectedMediaLoading(false);
      setSelectedMediaError(null);
      return;
    }

    const loadedMedia = mediaDocs.find((doc) => doc.id === mediaId);
    if (loadedMedia) {
      setSelectedMedia(loadedMedia);
      setSelectedMediaLoading(false);
      setSelectedMediaError(null);
      return;
    }

    let cancelled = false;
    setSelectedMediaLoading(true);
    setSelectedMediaError(null);
    void fetchMediaRecordById(mediaId)
      .then((media) => {
        if (cancelled) {
          return;
        }
        if (!media) {
          setSelectedMedia(null);
          setSelectedMediaError("Selected image could not be found.");
          return;
        }
        setSelectedMedia(media);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setSelectedMedia(null);
        setSelectedMediaError(
          err instanceof Error ? err.message : "Failed to load selected image",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setSelectedMediaLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [mediaDocs, mediaId]);

  const startImageUpload = (file: File): void => {
    setUploadFileName(file.name);
    handleImageUploadSelection({
      file,
      fieldName: field.name,
      patchField,
      setImageBusy,
      setImageError,
      clearInput: () => {
        if (uploadInputRef.current) {
          uploadInputRef.current.value = "";
        }
      },
    });
  };

  const handleImageDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    setDropTargetActive(false);
    if (uploadDisabled) {
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setImageError((prev) => ({
        ...prev,
        [field.name]: "Please drop an image file.",
      }));
      return;
    }
    setImageError((prev) => ({ ...prev, [field.name]: null }));
    startImageUpload(file);
  };

  return (
    <div className={fieldStyles.row}>
      <FieldHeader
        desc={desc}
        fieldType={field.type}
        id={id}
        label={label}
        required={field.required}
      />
      <div className={fieldStyles.imageFieldPanel}>
        <Input
          accept="image/*"
          className="sr-only"
          disabled={uploadDisabled}
          id={id}
          ref={uploadInputRef}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              return;
            }
            startImageUpload(file);
          }}
          type="file"
        />
        <div className={fieldStyles.imageLayout}>
          <div className="min-w-0">
            <Sheet
              onOpenChange={(open) => {
                setMediaPickerOpen(open);
                if (open) {
                  setMediaPickerField(field.name);
                } else if (mediaPickerField === field.name) {
                  setMediaPickerField(null);
                }
              }}
              open={mediaPickerOpen && mediaPickerField === field.name}
            >
              <SelectedImagePreview
                disabled={disabled}
                dropTargetActive={dropTargetActive}
                isUploading={isUploading}
                libraryControl={
                  <SheetTrigger asChild>
                    <Button
                      className="rounded-md"
                      disabled={uploadDisabled}
                      size="fieldCompact"
                      type="button"
                      variant="secondary"
                    >
                      <IconSearch aria-hidden className="size-4" />
                      Library
                    </Button>
                  </SheetTrigger>
                }
                mediaId={mediaId}
                onClear={() => patchField(field.name, "")}
                onDragLeave={() => setDropTargetActive(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!uploadDisabled) {
                    setDropTargetActive(true);
                  }
                }}
                onDrop={handleImageDrop}
                selectedMedia={selectedMedia}
                selectedMediaError={selectedMediaError}
                selectedMediaLoading={selectedMediaLoading}
              />
              <SheetContent className="contorro-admin-scope contorro-admin-custom-fields sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Select media</SheetTitle>
                  <SheetDescription>
                    Pick an existing Payload media record.
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="min-h-0 flex-1">
                  <div className={fieldStyles.mediaList}>
                    <MediaPickerList
                      mediaDocs={mediaDocs}
                      mediaLoadError={mediaLoadError}
                      mediaLoading={mediaLoading}
                      onPick={(mediaId) => {
                        patchField(field.name, mediaId);
                        setMediaPickerOpen(false);
                      }}
                    />
                  </div>
                </ScrollArea>
                <div className="pt-3">
                  <SheetClose asChild>
                    <Button size="field" type="button" variant="outline">
                      Close
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <aside className={fieldStyles.imageUploadRail}>
            <p className={fieldStyles.imageUploadRailHeading}>
              Upload from device
            </p>
            <p className={fieldStyles.imageUploadRailText}>
              Select a file here, then refine with drag-and-drop directly in the
              preview canvas.
            </p>
            <Button
              disabled={uploadDisabled}
              onClick={() => {
                uploadInputRef.current?.click();
              }}
              size="field"
              type="button"
              variant="default"
            >
              <IconUpload aria-hidden className="size-4" />
              Choose file
            </Button>
            <div
              aria-busy={isUploading}
              className={fieldStyles.imageUploadRailStatus}
            >
              <IconPhoto aria-hidden className="size-4 shrink-0" />
              <span className="truncate">
                {isUploading
                  ? `Uploading ${uploadFileName || "image"}...`
                  : uploadFileName
                    ? `Selected file: ${uploadFileName}`
                    : "PNG, JPG, WEBP or GIF"}
              </span>
            </div>
          </aside>
        </div>
      </div>
      {imageError[field.name] ? (
        <p className={fieldStyles.error}>{imageError[field.name]}</p>
      ) : null}
    </div>
  );
}

type SingleFieldProps = {
  field: EditorFieldSpec;
  v: unknown;
  disabled: boolean;
  patchField: Props["patchField"];
} & Omit<ImageFieldBlockProps, "field" | "v" | "id" | "label" | "desc">;

type CommonFieldBits = {
  field: EditorFieldSpec;
  v: unknown;
  disabled: boolean;
  patchField: Props["patchField"];
  id: string;
  label: string;
  desc?: string;
};

function EditorBooleanFieldRow({
  field,
  v,
  disabled,
  patchField,
  id,
  label,
  desc,
}: CommonFieldBits) {
  const checked = Boolean(v);
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-4",
        disabled && "opacity-60",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        id={id}
        onCheckedChange={(state) => {
          patchField(field.name, state === true);
        }}
      />
      <div className="grid min-w-0 gap-1 pt-0.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label
            className="cursor-pointer font-semibold leading-snug text-foreground"
            htmlFor={id}
          >
            {label}
            {field.required ? <RequiredMark /> : null}
          </Label>
          <span className={fieldStyles.typeBadge}>
            {fieldTypeLabel(field.type)}
          </span>
        </div>
        {desc ? <p className={fieldStyles.description}>{desc}</p> : null}
      </div>
    </div>
  );
}

function EditorNumberFieldRow({
  field,
  v,
  disabled,
  patchField,
  id,
  label,
  desc,
}: CommonFieldBits) {
  const n = typeof v === "number" ? v : Number(v);
  const value = v === "" || v == null || !Number.isFinite(n) ? "" : n;
  return (
    <div className={fieldStyles.row}>
      <FieldHeader
        desc={desc}
        fieldType={field.type}
        id={id}
        label={label}
        required={field.required}
      />
      <Input
        disabled={disabled}
        id={id}
        inputMode="decimal"
        onChange={(e) => {
          const num = Number(e.target.value);
          patchField(
            field.name,
            e.target.value === "" || Number.isNaN(num) ? "" : num,
          );
        }}
        type="number"
        value={value}
      />
    </div>
  );
}

function EditorRichTextFieldRow({
  field,
  v,
  disabled,
  patchField,
  id,
  label,
  desc,
}: CommonFieldBits) {
  const text = typeof v === "string" ? v : v != null ? String(v) : "";
  return (
    <div className={fieldStyles.row}>
      <FieldHeader
        desc={desc}
        fieldType={field.type}
        id={id}
        label={label}
        required={field.required}
      />
      <Textarea
        disabled={disabled}
        id={id}
        onChange={(e) => patchField(field.name, e.target.value)}
        rows={6}
        value={text}
      />
    </div>
  );
}

function EditorLinkFieldRow({
  field,
  v,
  disabled,
  patchField,
  id,
  label,
  desc,
}: CommonFieldBits) {
  const href = typeof v === "string" ? v : v != null ? String(v) : "";
  return (
    <div className={fieldStyles.row}>
      <FieldHeader
        desc={desc}
        fieldType={field.type}
        id={id}
        label={label}
        required={field.required}
      />
      <Input
        autoComplete="url"
        disabled={disabled}
        id={id}
        onChange={(e) => patchField(field.name, e.target.value)}
        placeholder="https://"
        type="url"
        value={href}
      />
    </div>
  );
}

function EditorTextFieldRow({
  field,
  v,
  disabled,
  patchField,
  id,
  label,
  desc,
}: CommonFieldBits) {
  const str = typeof v === "string" ? v : v != null ? String(v) : "";
  return (
    <div className={fieldStyles.row}>
      <FieldHeader
        desc={desc}
        fieldType={field.type}
        id={id}
        label={label}
        required={field.required}
      />
      <Input
        disabled={disabled}
        id={id}
        onChange={(e) => patchField(field.name, e.target.value)}
        type="text"
        value={str}
      />
    </div>
  );
}

function EditorSingleFieldRow(props: SingleFieldProps): ReactNode {
  const {
    field,
    v,
    disabled,
    patchField,
    imageBusy,
    setImageBusy,
    imageError,
    setImageError,
    mediaPickerField,
    setMediaPickerField,
    mediaPickerOpen,
    setMediaPickerOpen,
    mediaDocs,
    mediaLoading,
    mediaLoadError,
  } = props;
  const id = `editor-field-${field.name}`;
  const label = field.label || field.name;
  const desc = field.description;
  const common: CommonFieldBits = {
    field,
    v,
    disabled,
    patchField,
    id,
    label,
    desc,
  };

  const t = field.type;
  if (t === "boolean") {
    return <EditorBooleanFieldRow {...common} />;
  }
  if (t === "number") {
    return <EditorNumberFieldRow {...common} />;
  }
  if (t === "image") {
    return (
      <EditorImageFieldBlock
        desc={desc}
        disabled={disabled}
        field={field}
        id={id}
        imageBusy={imageBusy}
        imageError={imageError}
        label={label}
        mediaDocs={mediaDocs}
        mediaLoadError={mediaLoadError}
        mediaLoading={mediaLoading}
        mediaPickerField={mediaPickerField}
        mediaPickerOpen={mediaPickerOpen}
        patchField={patchField}
        setImageBusy={setImageBusy}
        setImageError={setImageError}
        setMediaPickerField={setMediaPickerField}
        setMediaPickerOpen={setMediaPickerOpen}
        v={v}
      />
    );
  }
  if (t === "richText") {
    return <EditorRichTextFieldRow {...common} />;
  }
  if (t === "link") {
    return <EditorLinkFieldRow {...common} />;
  }
  return <EditorTextFieldRow {...common} />;
}

/** CMS field editors for page templates and designer blocks (not layout slots / not props). */
export function EditorFieldsInputs({
  fields,
  current,
  patchField,
  disabled = false,
}: Props) {
  const [imageBusy, setImageBusy] = useState<Record<string, boolean>>({});
  const [imageError, setImageError] = useState<Record<string, string | null>>(
    {},
  );
  const [mediaPickerField, setMediaPickerField] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaDocs, setMediaDocs] = useState<MediaListItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);

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

  const imageProps = {
    imageBusy,
    setImageBusy,
    imageError,
    setImageError,
    mediaPickerField,
    setMediaPickerField,
    mediaPickerOpen,
    setMediaPickerOpen,
    mediaDocs,
    mediaLoading,
    mediaLoadError,
  };

  return (
    <div
      className="contorro-admin-scope contorro-admin-custom-fields space-y-4"
      data-contorro-editor-fields
    >
      {fields.map((field) => (
        <EditorSingleFieldRow
          disabled={disabled}
          field={field}
          key={field.name}
          patchField={patchField}
          v={current[field.name]}
          {...imageProps}
        />
      ))}
    </div>
  );
}
