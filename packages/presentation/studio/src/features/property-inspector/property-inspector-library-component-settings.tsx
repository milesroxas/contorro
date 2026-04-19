"use client";

import type { CompositionNode, EditorFieldSpec } from "@repo/contracts-zod";
import { editorFieldSpecsFromComposition } from "@repo/domains-composition";
import {
  fetchMediaRecordById,
  fetchMediaRecords,
  type MediaListItem,
  parsePayloadMediaRefId,
} from "@repo/infrastructure-payload-media-client";
import { IconArrowBackUp, IconPencil, IconRestore } from "@tabler/icons-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ui/button.js";
import { ButtonGroup } from "../../components/ui/button-group.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import { cn } from "../../lib/cn.js";
import { fetchExpandedLibraryComposition } from "../../lib/fetch-library-component-preview.js";
import { PayloadMediaPickerFields } from "./payload-media-picker-fields.js";

type LibraryComponentInstanceSettingsProps = {
  componentsHref: string;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
};

function instanceEditorFieldValues(
  node: CompositionNode,
): Record<string, unknown> {
  const raw = node.propValues?.editorFieldValues;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  return raw as Record<string, unknown>;
}

function fieldDefaultLabel(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "No default";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "Custom default";
}

function booleanValue(raw: unknown): boolean {
  return raw === true;
}

function numberInputValue(raw: unknown): string {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw;
  }
  return "";
}

function textValue(raw: unknown): string {
  if (typeof raw === "string") {
    return raw;
  }
  if (raw === undefined || raw === null) {
    return "";
  }
  return String(raw);
}

function fieldLabel(field: EditorFieldSpec): string {
  return field.label.trim() !== "" ? field.label : field.name;
}

/** Materialize spec defaults so instance state explicitly matches the library field defaults. */
function explicitLibraryDefaultValues(
  fields: EditorFieldSpec[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      out[f.name] = f.defaultValue;
    }
  }
  return out;
}

function FieldRowShell({
  children,
  defaultCaption,
  description,
  label,
  modified,
  onReset,
}: {
  children: React.ReactNode;
  defaultCaption?: string;
  description?: string;
  label: string;
  modified: boolean;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3 rounded-md border border-border/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <Label className="font-medium text-foreground">{label}</Label>
          {description ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {modified ? (
          <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
            <span
              aria-hidden
              className="inline-flex size-1.5 shrink-0 rounded-full bg-primary"
              title="Overridden"
            />
            <Button
              aria-label={`Reset ${label} to default`}
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={onReset}
              type="button"
              variant="ghost"
            >
              <IconRestore className="size-3.5" stroke={1.6} />
            </Button>
          </div>
        ) : null}
      </div>
      {children}
      {defaultCaption ? (
        <p className="text-[11px] text-muted-foreground">{defaultCaption}</p>
      ) : null}
    </div>
  );
}

function LibraryComponentImageField({
  baseId,
  defaultCaption,
  field,
  modified,
  onChange,
  onReset,
  rawValue,
}: {
  baseId: string;
  defaultCaption?: string;
  field: EditorFieldSpec;
  modified: boolean;
  onChange: (next: string) => void;
  onReset: () => void;
  rawValue: unknown;
}) {
  const stored = textValue(rawValue);
  const mediaId = useMemo(() => parsePayloadMediaRefId(rawValue), [rawValue]);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState<string | null>(null);
  const [mediaDocs, setMediaDocs] = useState<MediaListItem[]>([]);
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState<string | null>(
    null,
  );
  const [mediaResolveError, setMediaResolveError] = useState<string | null>(
    null,
  );

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

  useEffect(() => {
    if (mediaId == null) {
      setResolvedPreviewUrl(null);
      setMediaResolveError(null);
      return;
    }
    const fromList = mediaDocs.find((doc) => doc.id === mediaId);
    if (fromList) {
      setResolvedPreviewUrl(fromList.url);
      setMediaResolveError(null);
      return;
    }
    let cancelled = false;
    setMediaResolveError(null);
    void fetchMediaRecordById(mediaId)
      .then((media) => {
        if (cancelled) {
          return;
        }
        if (!media) {
          setResolvedPreviewUrl(null);
          setMediaResolveError("No media found for this id.");
          return;
        }
        setResolvedPreviewUrl(media.url);
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setResolvedPreviewUrl(null);
        setMediaResolveError(
          err instanceof Error ? err.message : "Failed to load media",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [mediaId, mediaDocs]);

  const previewSrc = mediaId != null ? (resolvedPreviewUrl ?? "") : stored;

  return (
    <FieldRowShell
      defaultCaption={defaultCaption}
      description={field.description}
      label={fieldLabel(field)}
      modified={modified}
      onReset={onReset}
    >
      <Input
        id={`${baseId}-${field.name}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder="https://"
        type="url"
        value={stored}
      />
      <PayloadMediaPickerFields
        altForUpload={fieldLabel(field)}
        baseId={`${baseId}-${field.name}`}
        busy={busy}
        mediaDocs={mediaDocs}
        mediaId={mediaId ?? ""}
        mediaLoadError={mediaLoadError}
        mediaLoading={mediaLoading}
        mediaPickerOpen={mediaPickerOpen}
        onSelectMediaDoc={(media) => {
          onChange(media.url);
        }}
        onUploadComplete={(media) => {
          onChange(media.url);
        }}
        setBusy={setBusy}
        setError={setError}
        setMediaPickerOpen={setMediaPickerOpen}
        src={previewSrc}
        uploadInputRef={uploadInputRef}
        variant="image"
      />
      {mediaResolveError ? (
        <p className="text-xs text-destructive" role="alert">
          {mediaResolveError}
        </p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </FieldRowShell>
  );
}

function LibraryComponentFieldRow({
  baseId,
  defaultCaption,
  field,
  modified,
  onChange,
  onReset,
  rawValue,
}: {
  baseId: string;
  defaultCaption?: string;
  field: EditorFieldSpec;
  modified: boolean;
  onChange: (next: unknown) => void;
  onReset: () => void;
  rawValue: unknown;
}) {
  if (field.type === "image") {
    return (
      <LibraryComponentImageField
        baseId={baseId}
        defaultCaption={defaultCaption}
        field={field}
        modified={modified}
        onChange={(next) => onChange(next)}
        onReset={onReset}
        rawValue={rawValue}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <FieldRowShell
        defaultCaption={defaultCaption}
        description={field.description}
        label={fieldLabel(field)}
        modified={modified}
        onReset={onReset}
      >
        <div className="flex items-center gap-2">
          <Checkbox
            checked={booleanValue(rawValue)}
            id={`${baseId}-${field.name}`}
            onCheckedChange={(next) => {
              onChange(next === true);
            }}
          />
          <Label
            className="text-sm font-normal"
            htmlFor={`${baseId}-${field.name}`}
          >
            Enabled
          </Label>
        </div>
      </FieldRowShell>
    );
  }

  if (field.type === "number") {
    return (
      <FieldRowShell
        defaultCaption={defaultCaption}
        description={field.description}
        label={fieldLabel(field)}
        modified={modified}
        onReset={onReset}
      >
        <Input
          id={`${baseId}-${field.name}`}
          inputMode="decimal"
          onChange={(event) => {
            const raw = event.target.value.trim();
            if (raw === "") {
              onChange("");
              return;
            }
            const parsed = Number(raw);
            onChange(Number.isFinite(parsed) ? parsed : "");
          }}
          type="number"
          value={numberInputValue(rawValue)}
        />
      </FieldRowShell>
    );
  }

  if (field.type === "richText") {
    return (
      <FieldRowShell
        defaultCaption={defaultCaption}
        description={field.description}
        label={fieldLabel(field)}
        modified={modified}
        onReset={onReset}
      >
        <textarea
          className={cn(
            "flex min-h-[4.5rem] w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-[color,box-shadow] outline-none",
            "placeholder:text-muted-foreground",
            "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
            "disabled:opacity-50",
          )}
          id={`${baseId}-${field.name}`}
          onChange={(event) => onChange(event.target.value)}
          value={textValue(rawValue)}
        />
      </FieldRowShell>
    );
  }

  return (
    <FieldRowShell
      defaultCaption={defaultCaption}
      description={field.description}
      label={fieldLabel(field)}
      modified={modified}
      onReset={onReset}
    >
      <Input
        id={`${baseId}-${field.name}`}
        onChange={(event) => onChange(event.target.value)}
        type={field.type === "link" ? "url" : "text"}
        value={textValue(rawValue)}
      />
    </FieldRowShell>
  );
}

export function LibraryComponentInstanceSettings({
  componentsHref,
  node,
  patchNodeProps,
}: LibraryComponentInstanceSettingsProps) {
  const baseId = useId();
  const componentKey =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey.trim()
      : "";
  const [fields, setFields] = useState<EditorFieldSpec[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!componentKey) {
      setFields([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const composition = await fetchExpandedLibraryComposition(componentKey);
      if (cancelled) {
        return;
      }
      if (!composition) {
        setFields([]);
        setError("Could not load component fields.");
        setLoading(false);
        return;
      }
      setFields(editorFieldSpecsFromComposition(composition));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [componentKey]);

  const values = useMemo(() => instanceEditorFieldValues(node), [node]);
  const hasOverrides = Object.keys(values).length > 0;
  const canBulkApplyDefaults = fields.length > 0;

  function patchFieldValue(fieldName: string, next: unknown) {
    patchNodeProps({
      editorFieldValues: {
        ...values,
        [fieldName]: next,
      },
    });
  }

  function resetFieldValue(fieldName: string) {
    if (!Object.hasOwn(values, fieldName)) {
      return;
    }
    const next = { ...values };
    delete next[fieldName];
    patchNodeProps({ editorFieldValues: next });
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-4">
      {componentsHref.trim() !== "" ? (
        <Button asChild className="w-full" size="sm" variant="secondary">
          <a href={componentsHref}>
            <IconPencil className="size-3.5" aria-hidden />
            Edit component
          </a>
        </Button>
      ) : null}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No instance fields.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <ButtonGroup aria-label="Instance field actions">
              <Button
                disabled={!canBulkApplyDefaults}
                onClick={() =>
                  patchNodeProps({
                    editorFieldValues: explicitLibraryDefaultValues(fields),
                  })
                }
                size="sm"
                type="button"
                variant="outline"
              >
                <IconRestore className="size-3.5" aria-hidden />
                Use defaults
              </Button>
              <Button
                disabled={!hasOverrides}
                onClick={() => patchNodeProps({ editorFieldValues: {} })}
                size="sm"
                type="button"
                variant="outline"
              >
                <IconArrowBackUp className="size-3.5" aria-hidden />
                Clear overrides
              </Button>
            </ButtonGroup>
          </div>
          {fields.map((field) => (
            <LibraryComponentFieldRow
              key={field.name}
              baseId={baseId}
              defaultCaption={`Default: ${fieldDefaultLabel(field.defaultValue)}`}
              field={field}
              modified={Object.hasOwn(values, field.name)}
              onChange={(next) => patchFieldValue(field.name, next)}
              onReset={() => resetFieldValue(field.name)}
              rawValue={values[field.name]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
