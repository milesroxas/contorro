"use client";

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconChevronDown,
  IconDeviceFloppy,
  IconPencil,
  IconRocket,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu.js";
import { Separator } from "../../components/ui/separator.js";

function draftSavePublicationPill(args: {
  saving: boolean;
  dirty: boolean;
  cmsPublicationStatus: "draft" | "published" | null;
}): { label: string; className: string; dotClassName: string } {
  const basePill =
    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium";
  if (args.saving) {
    return {
      label: "Saving...",
      className: `${basePill} border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300`,
      dotClassName: "size-1.5 rounded-full bg-sky-500",
    };
  }
  if (args.dirty) {
    return {
      label: "Unsaved changes",
      className: `${basePill} border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300`,
      dotClassName: "size-1.5 rounded-full bg-amber-500",
    };
  }
  if (args.cmsPublicationStatus === "published") {
    return {
      label: "Published",
      className: `${basePill} border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200`,
      dotClassName: "size-1.5 rounded-full bg-emerald-500",
    };
  }
  if (args.cmsPublicationStatus === "draft") {
    return {
      label: "Draft",
      className: `${basePill} border-amber-500/25 bg-amber-500/5 text-amber-800 dark:text-amber-200`,
      dotClassName: "size-1.5 rounded-full bg-amber-600",
    };
  }
  return {
    label: "Not saved",
    className: `${basePill} border-border bg-background text-muted-foreground`,
    dotClassName: "size-1.5 rounded-full bg-muted-foreground",
  };
}

export function DraftSaveBar({
  name,
  resourceLabel,
  canEditName,
  cmsPublicationStatus,
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
  resourceLabel: "Component" | "Page Template";
  canEditName: boolean;
  cmsPublicationStatus: "draft" | "published" | null;
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
  const fallbackName =
    resourceLabel === "Component"
      ? "Untitled component"
      : "Untitled page template";
  const displayName = name || fallbackName;
  const renameLabel = `Rename ${resourceLabel.toLowerCase()}`;

  const canOpenSyncMenu =
    !saving && (dirty || cmsPublicationStatus === "draft");

  const publicationPill = draftSavePublicationPill({
    saving,
    dirty,
    cmsPublicationStatus,
  });

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 dark:bg-muted/10">
      {editingName && canEditName ? (
        <>
          <input
            aria-label={`${resourceLabel} name`}
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
            {resourceLabel}: {displayName}
          </p>
          {canEditName ? (
            <Button
              aria-label={renameLabel}
              disabled={renaming}
              onClick={() => setEditingName(true)}
              size="sm"
              type="button"
              variant="ghost"
            >
              <IconPencil className="size-4" />
              <span className="sr-only">{renameLabel}</span>
            </Button>
          ) : null}
        </>
      )}
      <span aria-live="polite" className={publicationPill.className}>
        <span aria-hidden className={publicationPill.dotClassName} />
        {publicationPill.label}
      </span>
      <div className="min-w-0 flex-1" />
      <Button
        aria-label="Undo"
        className="hidden lg:inline-flex"
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
        className="hidden lg:inline-flex"
        disabled={!canRedo || saving}
        onClick={() => onRedo()}
        size="sm"
        title="Redo (Shift+Cmd/Ctrl+Z)"
        type="button"
        variant="ghost"
      >
        <IconArrowForwardUp className="size-4" />
      </Button>
      <Separator
        aria-hidden
        className="hidden h-5 bg-border lg:block"
        orientation="vertical"
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="hidden gap-1.5 lg:inline-flex"
            data-testid="studio-save-menu-trigger"
            disabled={!canOpenSyncMenu}
            size="sm"
            type="button"
            variant="outline"
          >
            Save changes
            <IconChevronDown aria-hidden className="size-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
            Sync with CMS
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
              data-testid="save-draft"
              disabled={!dirty}
              onSelect={() => {
                onSaveDraft();
              }}
            >
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <IconDeviceFloppy aria-hidden className="size-4 shrink-0" />
                Save draft
              </span>
              <span className="pl-6 text-[11px] leading-snug text-muted-foreground">
                Store your layout as a draft. Does not update the published
                version.
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
              data-testid="publish-studio"
              onSelect={() => {
                onPublish();
              }}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <IconRocket aria-hidden className="size-4 shrink-0" />
                Publish
              </span>
              <span className="pl-6 text-[11px] leading-snug text-muted-foreground">
                Update the published version used on the site and in the
                component library.
              </span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {error ? (
        <span className="text-xs font-medium text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
