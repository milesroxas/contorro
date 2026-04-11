"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import { useEffect, useMemo } from "react";

import { EditorCatalogPanel } from "../features/component-catalog/EditorCatalogPanel.js";
import { TextContentField } from "../features/content-fields/TextContentField.js";
import { ComposerDraftBar } from "../features/draft-save/ComposerDraftBar.js";
import { cn } from "../lib/cn.js";
import { createComposerStore } from "../model/composer-store.js";

/**
 * Content editor surface (Phase 4) — constrained editing vs full builder canvas.
 */
export function ComposerApp({
  pageId,
  canPublish = false,
}: {
  pageId: string;
  /** §5.2 — only admin/designer may publish to live */
  canPublish?: boolean;
}) {
  const useComposer = useMemo(() => createComposerStore(pageId), [pageId]);

  const composition = useComposer((s) => s.composition);
  const pageTitle = useComposer((s) => s.pageTitle);
  const pageSlug = useComposer((s) => s.pageSlug);
  const selectedTextNodeId = useComposer((s) => s.selectedTextNodeId);
  const dirty = useComposer((s) => s.dirty);
  const error = useComposer((s) => s.error);
  const setTextContent = useComposer((s) => s.setTextContent);
  const saveDraft = useComposer((s) => s.saveDraft);
  const selectTextNode = useComposer((s) => s.selectTextNode);
  const publish = useComposer((s) => s.publish);

  useEffect(() => {
    void useComposer.getState().load();
  }, [useComposer]);

  const textNodeIds = useMemo(() => {
    if (!composition) {
      return [];
    }
    return Object.values(composition.nodes)
      .filter((n: CompositionNode) => n.definitionKey === "primitive.text")
      .map((n) => n.id);
  }, [composition]);

  if (!composition) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-4 text-sm text-muted-foreground">
        {error ?? "Loading…"}
      </div>
    );
  }

  const draftPreviewHref = `/api/preview/enter?pageId=${encodeURIComponent(pageId)}`;

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm",
      )}
      data-testid="composer-app"
    >
      <ComposerDraftBar
        dirty={dirty}
        error={error}
        onSave={() => void saveDraft()}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 lg:max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {pageTitle}
            </h2>
            {canPublish ? (
              <button
                className={cn(
                  "inline-flex h-8 items-center rounded-md border border-border bg-background px-3 text-xs font-medium",
                  "hover:bg-muted/50",
                )}
                data-testid="composer-publish"
                onClick={() => void publish()}
                type="button"
              >
                Publish
              </button>
            ) : null}
          </div>
          <p className="font-mono text-xs text-muted-foreground">/{pageSlug}</p>
          {textNodeIds.length > 1 ? (
            <label className="flex max-w-md flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Text block
              </span>
              <select
                className="rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                onChange={(e) =>
                  selectTextNode(e.target.value === "" ? null : e.target.value)
                }
                value={selectedTextNodeId ?? ""}
              >
                {textNodeIds.map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="max-w-xl">
            <TextContentField
              composition={composition}
              nodeId={selectedTextNodeId}
              onChange={(v) => {
                if (selectedTextNodeId) {
                  setTextContent(selectedTextNodeId, v);
                }
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            SEO and social copy stay on the Page document (Lexical). Body copy
            lives in the composition tree, not in Lexical.
          </p>
          <a
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            href={draftPreviewHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open draft preview
          </a>
        </div>
        <div className="min-w-0 flex-1 lg:max-w-sm">
          <EditorCatalogPanel />
        </div>
      </div>
    </div>
  );
}
