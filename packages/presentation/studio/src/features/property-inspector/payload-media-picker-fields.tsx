import {
  type Icon,
  IconPhoto,
  IconPhotoOff,
  IconSearch,
  IconUpload,
  IconVideo,
} from "@tabler/icons-react";
import type { RefObject } from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import { Button } from "../../components/ui/button.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../../components/ui/sheet.js";
import type { MediaListItem, MediaRecord } from "../../lib/cms-media.js";
import { uploadMediaFile } from "../../lib/cms-media.js";

export type PayloadMediaPickerVariant = "image" | "video";

function mediaPickerThumb(variant: PayloadMediaPickerVariant, url: string) {
  if (variant === "image") {
    return (
      <img
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        src={url}
      />
    );
  }
  return (
    <video
      className="h-full w-full object-cover"
      muted
      playsInline
      preload="metadata"
      src={url}
    />
  );
}

function selectedPreview(
  variant: PayloadMediaPickerVariant,
  src: string,
  altOrLabel: string,
) {
  if (variant === "image") {
    return (
      <img
        alt={altOrLabel || "Selected image"}
        className="h-full w-full object-cover"
        src={src}
      />
    );
  }
  return (
    <video
      className="h-full w-full object-cover"
      controls={false}
      muted
      playsInline
      preload="metadata"
      src={src}
    />
  );
}

const LABELS = {
  image: {
    selected: "Selected image",
    emptyTitle: "No image selected",
    emptyHint: "Browse media or upload a new image",
    uploadLabel: "Upload new image",
    uploadHint: "PNG, JPG, WEBP or GIF",
    browseTitle: "Select media",
    browseDescription: "Pick an existing Payload media record.",
  },
  video: {
    selected: "Selected video",
    emptyTitle: "No video selected",
    emptyHint: "Browse media or upload a new video",
    uploadLabel: "Upload new video",
    uploadHint: "MP4, WEBM or other supported video",
    browseTitle: "Select media",
    browseDescription: "Pick an existing Payload media record.",
  },
} as const;

type MediaPickerCopy = (typeof LABELS)[PayloadMediaPickerVariant];

function MediaDocPickerList({
  variant,
  mediaDocs,
  mediaLoadError,
  mediaLoading,
  onPick,
}: {
  variant: PayloadMediaPickerVariant;
  mediaDocs: MediaListItem[];
  mediaLoadError: string | null;
  mediaLoading: boolean;
  onPick: (media: MediaListItem) => void;
}) {
  if (mediaLoading) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }
  if (mediaLoadError) {
    return <p className="text-sm text-red-500">{mediaLoadError}</p>;
  }
  if (mediaDocs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No media entries found.</p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {mediaDocs.map((media) => (
        <button
          className="group w-full overflow-hidden rounded-lg border border-border/70 bg-background text-left transition-colors hover:border-border hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          key={media.id}
          onClick={() => onPick(media)}
          type="button"
        >
          <div className="aspect-4/3 overflow-hidden border-b border-border/60 bg-muted/20">
            {mediaPickerThumb(variant, media.url)}
          </div>
          <div className="space-y-1.5 p-3">
            <div className="line-clamp-2 text-sm font-medium leading-snug">
              {media.alt || media.filename || media.url}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {media.filename || "Payload media"}
            </div>
            <div className="text-[11px] text-muted-foreground/90">
              ID {media.id}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function MediaSelectionPreview({
  EmptyIcon,
  RowIcon,
  altForUpload,
  copy,
  mediaId,
  src,
  variant,
}: {
  EmptyIcon: Icon;
  RowIcon: Icon;
  altForUpload: string;
  copy: MediaPickerCopy;
  mediaId: number | "";
  src: string;
  variant: PayloadMediaPickerVariant;
}) {
  if (!src) {
    return (
      <div className="flex aspect-4/3 flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground">
        <EmptyIcon aria-hidden className="size-8" />
        <p className="text-sm font-medium">{copy.emptyTitle}</p>
        <p className="text-xs">{copy.emptyHint}</p>
      </div>
    );
  }
  const caption = altForUpload || `Media ${mediaId || "selected"}`;
  return (
    <div className="space-y-2 p-2">
      <div className="aspect-4/3 overflow-hidden rounded-sm border border-border/70 bg-background">
        {selectedPreview(
          variant,
          src,
          variant === "image" ? altForUpload : "Selected video",
        )}
      </div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <RowIcon aria-hidden className="size-3.5" />
        <span className="truncate">{caption}</span>
      </div>
    </div>
  );
}

export function PayloadMediaPickerFields({
  variant,
  baseId,
  altForUpload,
  src,
  mediaId,
  busy,
  mediaDocs,
  mediaLoadError,
  mediaLoading,
  mediaPickerOpen,
  onSelectMediaDoc,
  onUploadComplete,
  setBusy,
  setError,
  setMediaPickerOpen,
  uploadInputRef,
}: {
  variant: PayloadMediaPickerVariant;
  baseId: string;
  /** Passed to upload API as alt text (image uses descriptive alt; video may use filename). */
  altForUpload: string;
  src: string;
  mediaId: number | "";
  busy: boolean;
  mediaDocs: MediaListItem[];
  mediaLoadError: string | null;
  mediaLoading: boolean;
  mediaPickerOpen: boolean;
  onSelectMediaDoc: (media: MediaListItem) => void;
  onUploadComplete: (media: MediaRecord, file: File) => void;
  setBusy: (next: boolean) => void;
  setError: (message: string | null) => void;
  setMediaPickerOpen: (open: boolean) => void;
  uploadInputRef: RefObject<HTMLInputElement | null>;
}) {
  const copy = LABELS[variant];
  const accept = variant === "image" ? "image/*" : "video/*";
  const EmptyIcon = variant === "image" ? IconPhotoOff : IconVideo;
  const RowIcon = variant === "image" ? IconPhoto : IconVideo;

  return (
    <div className="space-y-5 border-t border-border/60 pt-5">
      <div className="space-y-3">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <Label className="min-w-0 truncate">{copy.selected}</Label>
          <Sheet onOpenChange={setMediaPickerOpen} open={mediaPickerOpen}>
            <SheetTrigger asChild>
              <Button
                className="shrink-0 border border-border/70"
                size="sm"
                type="button"
                variant="ghost"
              >
                <IconSearch aria-hidden className="mr-1.5 size-4" />
                Browse
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>{copy.browseTitle}</SheetTitle>
                <SheetDescription>{copy.browseDescription}</SheetDescription>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <div className="py-1 pr-2">
                  <MediaDocPickerList
                    mediaDocs={mediaDocs}
                    mediaLoadError={mediaLoadError}
                    mediaLoading={mediaLoading}
                    onPick={(media) => {
                      onSelectMediaDoc(media);
                      setMediaPickerOpen(false);
                    }}
                    variant={variant}
                  />
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </div>
        <div className="overflow-hidden rounded-md border border-border/70 bg-muted/20">
          <MediaSelectionPreview
            EmptyIcon={EmptyIcon}
            RowIcon={RowIcon}
            altForUpload={altForUpload}
            copy={copy}
            mediaId={mediaId}
            src={src}
            variant={variant}
          />
        </div>
      </div>
      <div className="space-y-3">
        <Label className="text-xs" htmlFor={`${baseId}-media-upload`}>
          {copy.uploadLabel}
        </Label>
        <Input
          accept={accept}
          className="sr-only"
          disabled={busy}
          id={`${baseId}-media-upload`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) {
              return;
            }
            setBusy(true);
            setError(null);
            void uploadMediaFile(file, altForUpload)
              .then((media) => {
                onUploadComplete(media, file);
              })
              .catch((uploadErr) => {
                setError(
                  uploadErr instanceof Error
                    ? uploadErr.message
                    : "Upload failed",
                );
              })
              .finally(() => {
                setBusy(false);
                e.target.value = "";
              });
          }}
          ref={uploadInputRef}
          type="file"
        />
        <div className="rounded-md border border-dashed border-border/70 bg-muted/10 p-3">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
              <IconUpload aria-hidden className="size-3.5 shrink-0" />
              <span className="truncate">
                {busy ? "Uploading…" : copy.uploadHint}
              </span>
            </div>
            <Button
              className="text-xs"
              disabled={busy}
              onClick={() => uploadInputRef.current?.click()}
              size="xs"
              type="button"
              variant="default"
            >
              {busy ? "Uploading..." : "Choose file"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
