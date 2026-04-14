"use client";

import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconChevronDown,
  IconExternalLink,
  IconLayoutDashboard,
  IconPalette,
  IconPencil,
  IconPuzzle,
} from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "../../components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu.js";
import { Separator } from "../../components/ui/separator.js";

export function DraftSaveBar({
  name,
  canEditName,
  adminHref,
  dashboardHref,
  componentsHref,
  designSystemHref,
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
  adminHref: string;
  dashboardHref: string;
  componentsHref: string;
  designSystemHref: string;
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

  let saveStatus = "Saved";
  let saveStatusClassName =
    "inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground";
  let saveStatusDotClassName = "size-1.5 rounded-full bg-muted-foreground";
  if (saving) {
    saveStatus = "Saving...";
    saveStatusClassName =
      "inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300";
    saveStatusDotClassName = "size-1.5 rounded-full bg-sky-500";
  } else if (dirty) {
    saveStatus = "Draft";
    saveStatusClassName =
      "inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300";
    saveStatusDotClassName = "size-1.5 rounded-full bg-amber-500";
  }

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-muted/20 px-4 py-3 dark:bg-muted/10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Open Studio navigation menu"
            className="gap-1.5"
            size="sm"
            type="button"
            variant="ghost"
          >
            Menu
            <IconChevronDown aria-hidden className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Studio</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="gap-2">
              <a href={dashboardHref}>
                <IconLayoutDashboard aria-hidden className="size-4" />
                Dashboard
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <a href={componentsHref}>
                <IconPuzzle aria-hidden className="size-4" />
                Components
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2">
              <a href={designSystemHref}>
                <IconPalette aria-hidden className="size-4" />
                Design system
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>CMS</DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem asChild className="gap-2">
              <a href={adminHref} rel="noopener noreferrer" target="_blank">
                <IconExternalLink aria-hidden className="size-4" />
                Open CMS
              </a>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator aria-hidden className="h-5 w-px bg-border" />
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
      <span aria-live="polite" className={saveStatusClassName}>
        <span aria-hidden className={saveStatusDotClassName} />
        {saveStatus}
      </span>
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
      <Separator aria-hidden className="h-5 w-px bg-border" />
      <div className="flex items-center gap-2 rounded-md border border-border/70 p-1">
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
        <Separator aria-hidden className="h-5 w-px bg-border" />
        <Button
          className="font-semibold"
          data-testid="publish-studio"
          disabled={!dirty || saving}
          onClick={() => onPublish()}
          size="sm"
          type="button"
          variant="ghost"
        >
          Publish
        </Button>
      </div>
      {error ? (
        <span className="text-xs font-medium text-destructive">{error}</span>
      ) : null}
    </div>
  );
}
