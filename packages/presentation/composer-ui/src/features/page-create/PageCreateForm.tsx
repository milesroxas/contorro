"use client";

import { type FormEvent, useEffect, useState } from "react";

import { cn } from "../../lib/cn.js";
import {
  type ComposerTemplateSummary,
  createComposerPage,
  fetchComposerTemplates,
} from "../../lib/composer-api.js";

export function PageCreateForm({
  onCreated,
}: {
  onCreated: (pageId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [mode, setMode] = useState<"blank" | "template">("blank");
  const [templateId, setTemplateId] = useState("");
  const [templates, setTemplates] = useState<ComposerTemplateSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const t = await fetchComposerTemplates();
        setTemplates(t);
        if (t[0]) {
          setTemplateId(t[0].id);
        }
      } catch {
        setTemplates([]);
      }
    })();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result =
        mode === "blank"
          ? await createComposerPage({
              mode: "blank",
              title,
              slug,
            })
          : await createComposerPage({
              mode: "template",
              title,
              slug,
              templateId,
            });
      onCreated(result.pageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4 p-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">New page</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a blank page or start from a published template.
        </p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)}>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Title
          </span>
          <input
            className={cn(
              "rounded-md border border-input bg-background px-3 py-2 text-sm",
            )}
            onChange={(e) => setTitle(e.target.value)}
            required
            value={title}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            URL slug
          </span>
          <input
            className={cn(
              "rounded-md border border-input bg-background px-3 py-2 font-mono text-sm",
            )}
            onChange={(e) => setSlug(e.target.value)}
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            placeholder="my-page"
            required
            title="Lowercase letters, numbers, and hyphens"
            value={slug}
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">
            Starting point
          </span>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={mode === "blank"}
              name="mode"
              onChange={() => setMode("blank")}
              type="radio"
            />
            Blank layout (empty stack)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              checked={mode === "template"}
              disabled={templates.length === 0}
              name="mode"
              onChange={() => setMode("template")}
              type="radio"
            />
            From template
          </label>
        </fieldset>
        {mode === "template" && templates.length > 0 ? (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground">
              Template
            </span>
            <select
              className="rounded-md border border-input bg-background px-2 py-2 text-sm"
              onChange={(e) => setTemplateId(e.target.value)}
              value={templateId}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          className={cn(
            "inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground",
            "disabled:opacity-50",
          )}
          disabled={loading}
          type="submit"
        >
          {loading ? "Creating…" : "Create page"}
        </button>
      </form>
    </div>
  );
}
