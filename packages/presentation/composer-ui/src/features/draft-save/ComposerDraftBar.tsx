"use client";

import { cn } from "../../lib/cn.js";

export function ComposerDraftBar({
  dirty,
  error,
  onSave,
}: {
  dirty: boolean;
  error: string | null;
  onSave: () => void;
}) {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 dark:bg-muted/10">
      <button
        className={cn(
          "inline-flex h-8 items-center justify-center rounded-md border border-transparent bg-primary px-3 text-xs font-medium text-primary-foreground shadow-sm",
          "transition-colors hover:bg-primary/90",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          "disabled:pointer-events-none disabled:opacity-40",
        )}
        data-testid="composer-save-draft"
        disabled={!dirty}
        onClick={() => onSave()}
        type="button"
      >
        Save draft
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
