"use client";

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconPencil,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "../../lib/cn.js";

const btnSecondary = cn(
  "inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm",
  "transition-colors hover:bg-muted",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
  "disabled:pointer-events-none disabled:opacity-40",
);

const btnPrimary = cn(
  "inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm",
  "transition-colors hover:bg-primary/90",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
  "disabled:pointer-events-none disabled:opacity-40",
);

const btnGhost = cn(
  "inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 text-xs font-medium text-muted-foreground",
  "transition-colors hover:bg-muted hover:text-foreground",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
  "disabled:pointer-events-none disabled:opacity-40",
);

export function DraftSaveBar({
  name,
  canEditName,
  studioHref,
  canUndo,
  canRedo,
  dirty,
  error,
  saving,
  renaming,
  onUndo,
  onRedo,
  onRename,
  onSaveDraft,
  onPublish,
}: {
  name: string;
  canEditName: boolean;
  studioHref: string;
  canUndo: boolean;
  canRedo: boolean;
  dirty: boolean;
  error: string | null;
  saving: boolean;
  renaming: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRename: (name: string) => Promise<void>;
  onSaveDraft: () => void;
  onPublish: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  const hasNameChanges = useMemo(
    () => draftName.trim() !== "" && draftName.trim() !== name,
    [draftName, name],
  );

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 dark:bg-muted/10">
      <a className={btnGhost} href={studioHref}>
        Studio
      </a>
      <div className="h-5 w-px bg-border" />
      {editingName && canEditName ? (
        <>
          <input
            aria-label="Template name"
            className="h-8 min-w-[220px] max-w-[38vw] rounded-md border border-border bg-background px-2.5 text-xs text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onChange={(e) => setDraftName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onRename(draftName.trim());
                setEditingName(false);
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setDraftName(name);
                setEditingName(false);
              }
            }}
            value={draftName}
          />
          <button
            className={btnSecondary}
            disabled={!hasNameChanges || renaming}
            onClick={() => {
              void onRename(draftName.trim());
              setEditingName(false);
            }}
            type="button"
          >
            Save name
          </button>
          <button
            className={btnGhost}
            disabled={renaming}
            onClick={() => {
              setDraftName(name);
              setEditingName(false);
            }}
            type="button"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <p className="max-w-[32vw] truncate text-xs font-medium text-foreground">
            {name || "Untitled template"}
          </p>
          {canEditName ? (
            <button
              aria-label="Rename template"
              className={btnGhost}
              disabled={renaming}
              onClick={() => setEditingName(true)}
              type="button"
            >
              <IconPencil className="size-4" />
              <span className="sr-only">Rename template</span>
            </button>
          ) : null}
        </>
      )}
      <div className="min-w-0 flex-1" />
      <button
        aria-label="Undo"
        className={btnGhost}
        disabled={!canUndo || saving}
        onClick={() => onUndo()}
        title="Undo (Cmd/Ctrl+Z)"
        type="button"
      >
        <IconArrowBackUp className="size-4" />
      </button>
      <button
        aria-label="Redo"
        className={btnGhost}
        disabled={!canRedo || saving}
        onClick={() => onRedo()}
        title="Redo (Shift+Cmd/Ctrl+Z)"
        type="button"
      >
        <IconArrowForwardUp className="size-4" />
      </button>
      <div className="h-5 w-px bg-border" />
      <button
        className={btnSecondary}
        data-testid="save-draft"
        disabled={!dirty || saving}
        onClick={() => onSaveDraft()}
        type="button"
      >
        Save draft
      </button>
      <button
        className={btnPrimary}
        data-testid="publish-builder"
        disabled={!dirty || saving}
        onClick={() => onPublish()}
        type="button"
      >
        Save &amp; publish
      </button>
      {dirty ? (
        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
          Unsaved changes
        </span>
      ) : (
        <span className="text-xs text-muted-foreground">Saved</span>
      )}
      {error ? (
        <span className="text-xs font-medium text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
