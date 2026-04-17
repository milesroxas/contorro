"use client";

import { studioRowIdForComponent } from "@repo/domains-composition";
import {
  IconChevronDown,
  IconDeviceFloppy,
  IconPencil,
  IconRocket,
} from "@tabler/icons-react";
import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { Button } from "../components/ui/button.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu.js";
import { Input } from "../components/ui/input.js";
import { cn } from "../lib/cn.js";
import { COMPONENTS_SLUG } from "./hub/constants.js";

type PatchNameResult =
  | {
      ok: true;
      name: string;
      updatedAt?: string;
      _status?: "draft" | "published" | null;
    }
  | { ok: false; message: string };

async function patchResourceNameViaStudio(options: {
  collectionSlug: string;
  documentId: string;
  value: string;
  intent: "draft" | "publish";
}): Promise<PatchNameResult> {
  const compositionId =
    options.collectionSlug === COMPONENTS_SLUG
      ? studioRowIdForComponent(options.documentId)
      : options.documentId;
  const res = await fetch(
    `/api/studio/compositions/${encodeURIComponent(compositionId)}`,
    {
      body: JSON.stringify({
        intent: options.intent,
        name: options.value,
      }),
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );

  if (!res.ok) {
    let message = "Could not save name";
    try {
      const err = (await res.json()) as {
        error?: { code?: string };
        errors?: { message?: string }[];
      };
      const first = err.errors?.[0]?.message;
      if (typeof first === "string") {
        message = first;
      }
    } catch {
      // ignore
    }
    return { message, ok: false };
  }

  const json = (await res.json()) as {
    data?: {
      name?: string;
      updatedAt?: string;
      _status?: "draft" | "published" | null;
    };
  };
  const data = json.data;
  const name = typeof data?.name === "string" ? data.name : options.value;
  const updatedAt =
    typeof data?.updatedAt === "string" ? data.updatedAt : undefined;
  const _status = data?._status;
  return {
    _status,
    name,
    ok: true,
    updatedAt,
  };
}

export type DashboardResourceNameProps = {
  collectionSlug: string;
  documentId: string;
  name: string;
  nameField: "title" | "displayName";
  resourceLabel: string;
  onApplied: (result: {
    name: string;
    updatedAt?: string;
    _status?: string | null;
  }) => void;
  className?: string;
  /** Overrides default title typography in read-only mode (e.g. recent list vs main lists). */
  readOnlyNameClassName?: string;
};

export function DashboardResourceName({
  collectionSlug,
  documentId,
  name,
  nameField,
  resourceLabel,
  onApplied,
  className,
  readOnlyNameClassName,
}: DashboardResourceNameProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing && !saving) {
      setDraft(name);
    }
  }, [editing, name, saving]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const cancel = useCallback(() => {
    setError(null);
    setDraft(name);
    setEditing(false);
  }, [name]);

  const commit = useCallback(
    async (intent: "draft" | "publish") => {
      const trimmed = draft.trim();
      if (trimmed === "") {
        setError("Name is required");
        return;
      }
      if (trimmed === name.trim()) {
        cancel();
        return;
      }
      setSaving(true);
      setError(null);
      const result = await patchResourceNameViaStudio({
        collectionSlug,
        documentId,
        intent,
        value: trimmed,
      });
      setSaving(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onApplied({
        _status: result._status ?? undefined,
        name: result.name,
        updatedAt: result.updatedAt,
      });
      setEditing(false);
    },
    [cancel, collectionSlug, documentId, draft, name, onApplied],
  );

  const onInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void commit("draft");
      }
      if (event.key === "Escape") {
        event.preventDefault();
        cancel();
      }
    },
    [cancel, commit],
  );

  if (editing) {
    return (
      <div className={cn("space-y-2", className)} data-name-field={nameField}>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-invalid={Boolean(error)}
            aria-label={`${resourceLabel} name`}
            className="h-8 min-w-0 flex-1 text-sm font-semibold md:text-base"
            disabled={saving}
            id={inputId}
            onChange={(event) => {
              setDraft(event.target.value);
            }}
            onKeyDown={onInputKeyDown}
            ref={inputRef}
            value={draft}
          />
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Button
              disabled={saving}
              onClick={cancel}
              size="sm"
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="gap-1.5"
                  data-testid="dashboard-name-save-menu"
                  disabled={saving}
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
                  Sync name with CMS
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
                    data-testid="dashboard-name-save-draft"
                    onSelect={() => {
                      void commit("draft");
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <IconDeviceFloppy
                        aria-hidden
                        className="size-4 shrink-0"
                      />
                      Save draft
                    </span>
                    <span className="pl-6 text-[11px] leading-snug text-muted-foreground">
                      Update the draft only. Does not publish.
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="flex cursor-pointer flex-col items-start gap-0.5 py-2.5"
                    data-testid="dashboard-name-publish"
                    onSelect={() => {
                      void commit("publish");
                    }}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <IconRocket aria-hidden className="size-4 shrink-0" />
                      Publish
                    </span>
                    <span className="pl-6 text-[11px] leading-snug text-muted-foreground">
                      Save the name to the published version.
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {error ? (
          <output className="block text-xs text-destructive">{error}</output>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          Enter saves as draft. Use the menu to publish.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("group flex min-w-0 items-start gap-1.5", className)}>
      <button
        className={cn(
          "min-w-0 flex-1 truncate text-left text-foreground",
          readOnlyNameClassName ?? "text-sm font-semibold md:text-base",
          "rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
        onClick={() => {
          setError(null);
          setDraft(name);
          setEditing(true);
        }}
        type="button"
      >
        {name}
      </button>
      <Button
        aria-label={`Rename ${resourceLabel}`}
        className="size-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        onClick={() => {
          setError(null);
          setDraft(name);
          setEditing(true);
        }}
        size="sm"
        type="button"
        variant="ghost"
      >
        <IconPencil className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
