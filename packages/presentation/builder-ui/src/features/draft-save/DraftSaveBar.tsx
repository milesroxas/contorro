"use client";

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
  dirty,
  error,
  saving,
  onSaveDraft,
  onPublish,
  onCancel,
}: {
  dirty: boolean;
  error: string | null;
  saving: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 dark:bg-muted/10">
      <button
        className={btnGhost}
        data-testid="cancel-builder"
        disabled={!dirty || saving}
        onClick={() => onCancel()}
        type="button"
      >
        Cancel
      </button>
      <div className="min-w-0 flex-1" />
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
