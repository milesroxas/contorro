"use client";

import type { EditorFieldSpec } from "@repo/contracts-zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

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
    .map((doc) => ({
      id: typeof doc.id === "number" ? doc.id : Number.NaN,
      url: typeof doc.url === "string" ? doc.url : "",
      alt: typeof doc.alt === "string" ? doc.alt : "",
      filename: typeof doc.filename === "string" ? doc.filename : "",
    }))
    .filter((doc) => Number.isFinite(doc.id) && doc.url.length > 0);
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
};

function FieldHeader({ id, label, desc, required }: FieldHeaderProps) {
  return (
    <>
      <Label htmlFor={id}>
        {label}
        {required ? <RequiredMark /> : null}
      </Label>
      {desc ? <p className="text-xs text-muted-foreground">{desc}</p> : null}
    </>
  );
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
  const mediaId =
    typeof v === "number"
      ? v
      : typeof v === "string" && /^\d+$/.test(v)
        ? Number.parseInt(v, 10)
        : "";

  return (
    <div className="space-y-1.5">
      <FieldHeader
        desc={desc}
        id={id}
        label={label}
        required={field.required}
      />
      <div className="flex items-center gap-2">
        <Input
          disabled={disabled}
          id={id}
          inputMode="numeric"
          onChange={(e) => {
            const t = e.target.value.trim();
            if (t === "") {
              patchField(field.name, "");
              return;
            }
            const parsed = Number.parseInt(t, 10);
            patchField(field.name, Number.isFinite(parsed) ? parsed : t);
          }}
          type="text"
          value={mediaId === "" ? "" : String(mediaId)}
        />
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
          <SheetTrigger asChild>
            <Button disabled={disabled} type="button" variant="outline">
              Browse
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Select media</SheetTitle>
              <SheetDescription>
                Pick an existing Payload media record.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-2 overflow-y-auto">
              {mediaLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : mediaLoadError ? (
                <p className="text-sm text-destructive">{mediaLoadError}</p>
              ) : mediaDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No media entries found.
                </p>
              ) : (
                mediaDocs.map((media) => (
                  <button
                    className="w-full rounded-md border border-border/60 p-2 text-left hover:bg-muted/50"
                    key={media.id}
                    onClick={() => {
                      patchField(field.name, media.id);
                      setMediaPickerOpen(false);
                    }}
                    type="button"
                  >
                    <div className="text-sm font-medium">
                      {media.alt || media.filename || media.url}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID {media.id}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="pt-3">
              <SheetClose asChild>
                <Button type="button" variant="outline">
                  Close
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <Label htmlFor={`${id}-upload`}>Upload image</Label>
      <Input
        accept="image/*"
        disabled={disabled || imageBusy[field.name]}
        id={`${id}-upload`}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) {
            return;
          }
          setImageBusy((prev) => ({ ...prev, [field.name]: true }));
          setImageError((prev) => ({ ...prev, [field.name]: null }));
          void uploadMediaFile(file, file.name)
            .then((media) => {
              patchField(field.name, media.id);
            })
            .catch((err) => {
              setImageError((prev) => ({
                ...prev,
                [field.name]:
                  err instanceof Error ? err.message : "Upload failed",
              }));
            })
            .finally(() => {
              setImageBusy((prev) => ({ ...prev, [field.name]: false }));
              e.target.value = "";
            });
        }}
        type="file"
      />
      {imageError[field.name] ? (
        <p className="text-xs text-destructive">{imageError[field.name]}</p>
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
        "flex items-start gap-2.5 rounded-none border border-border/60 bg-muted/20 px-3 py-2.5",
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
      <div className="grid min-w-0 gap-1 pt-0.5 leading-none">
        <Label className="cursor-pointer font-normal leading-snug" htmlFor={id}>
          {label}
          {field.required ? <RequiredMark /> : null}
        </Label>
        {desc ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {desc}
          </p>
        ) : null}
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
  const n = typeof v === "number" ? v : v === "" ? 0 : Number(v);
  return (
    <div className="space-y-1.5">
      <FieldHeader
        desc={desc}
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
        value={Number.isFinite(n) ? n : ""}
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
    <div className="space-y-1.5">
      <FieldHeader
        desc={desc}
        id={id}
        label={label}
        required={field.required}
      />
      <Textarea
        disabled={disabled}
        id={id}
        onChange={(e) => patchField(field.name, e.target.value)}
        rows={5}
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
    <div className="space-y-1.5">
      <FieldHeader
        desc={desc}
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
    <div className="space-y-1.5">
      <FieldHeader
        desc={desc}
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
    <div className="space-y-4">
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
