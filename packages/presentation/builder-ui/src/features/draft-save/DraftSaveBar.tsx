"use client";

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconPencil,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../components/ui/button.js";

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
      <Button asChild size="sm" variant="ghost">
        <a href={studioHref}>Studio</a>
      </Button>
      <div className="h-5 w-px bg-border" />
      {editingName && canEditName ? (
        <>
          <input
            aria-label="Template name"
            className="h-8 min-w-[220px] max-w-[38vw] rounded-md border border-border bg-background px-2.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <Button
            disabled={!hasNameChanges || renaming}
            onClick={() => {
              void onRename(draftName.trim());
              setEditingName(false);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Save name
          </Button>
          <Button
            disabled={renaming}
            onClick={() => {
              setDraftName(name);
              setEditingName(false);
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <p className="max-w-[32vw] truncate text-sm font-medium text-foreground">
            {name || "Untitled template"}
          </p>
          {canEditName ? (
            <Button
              aria-label="Rename template"
              disabled={renaming}
              onClick={() => setEditingName(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <IconPencil className="size-4" />
              <span className="sr-only">Rename template</span>
            </Button>
          ) : null}
        </>
      )}
      <div className="min-w-0 flex-1" />
      <Button
        aria-label="Undo"
        disabled={!canUndo || saving}
        onClick={() => onUndo()}
        size="sm"
        title="Undo (Cmd/Ctrl+Z)"
        type="button"
        variant="ghost"
      >
        <IconArrowBackUp className="size-4" />
      </Button>
      <Button
        aria-label="Redo"
        disabled={!canRedo || saving}
        onClick={() => onRedo()}
        size="sm"
        title="Redo (Shift+Cmd/Ctrl+Z)"
        type="button"
        variant="ghost"
      >
        <IconArrowForwardUp className="size-4" />
      </Button>
      <div className="h-5 w-px bg-border" />
      <Button
        data-testid="save-draft"
        disabled={!dirty || saving}
        onClick={() => onSaveDraft()}
        size="sm"
        type="button"
        variant="ghost"
      >
        Save draft
      </Button>
      <Button
        data-testid="publish-builder"
        disabled={!dirty || saving}
        onClick={() => onPublish()}
        size="sm"
        type="button"
      >
        Save &amp; publish
      </Button>
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
