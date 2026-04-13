"use client";

import { useConfig } from "@payloadcms/ui";
import {
  IconArrowLeft,
  IconEdit,
  IconLayout,
  IconPlus,
  IconPuzzle,
  IconSearch,
} from "@tabler/icons-react";
import { formatAdminURL } from "payload/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { COMPONENTS_SLUG, PAGE_COMPOSITIONS_SLUG } from "./constants";
import { HubChoiceButton, HubChoiceLink } from "./hub-choice-tile";
import {
  hubEyebrowClass,
  hubFilterLabelClass,
  hubInputClass,
  hubLeadClass,
  hubPanelClass,
  hubStepShellClass,
  hubTileGridClass,
  hubTitleClass,
  hubViewportClass,
} from "./hub-styles";
import { ModifyResourceList } from "./modify-resource-list";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const tileIconClass = "size-5 md:size-6";

type PageTemplateRow = {
  id: string | number;
  title: string;
  updatedAt?: string;
  _status?: string | null;
};

type ComponentRow = {
  id: string | number;
  displayName: string;
  key?: string;
  updatedAt?: string;
  _status?: string | null;
};

type HubStep =
  | { name: "intent" }
  | { name: "create" }
  | { name: "modify-pick" }
  | { name: "modify-list"; resource: "templates" | "components" };

export default function BuilderHub() {
  const { config } = useConfig();
  const adminRoute = config.routes?.admin ?? "/admin";

  const [hubStep, setHubStep] = useState<HubStep>({ name: "intent" });

  const [templateDocs, setTemplateDocs] = useState<PageTemplateRow[] | null>(
    null,
  );
  const [componentDocs, setComponentDocs] = useState<ComponentRow[] | null>(
    null,
  );
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [modifySearch, setModifySearch] = useState("");

  const createTemplateHref = formatAdminURL({
    adminRoute,
    path: `/collections/${PAGE_COMPOSITIONS_SLUG}/create`,
    relative: true,
  });
  const createComponentHref = formatAdminURL({
    adminRoute,
    path: `/collections/${COMPONENTS_SLUG}/create`,
    relative: true,
  });

  const fetchTemplates = useCallback(async (signal: AbortSignal) => {
    setLoadState("loading");
    try {
      const res = await fetch(
        `/api/${PAGE_COMPOSITIONS_SLUG}?limit=200&depth=0&sort=-updatedAt`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
        },
      );
      if (!res.ok) {
        setLoadState("error");
        return;
      }
      const json = (await res.json()) as { docs?: PageTemplateRow[] };
      setTemplateDocs(Array.isArray(json.docs) ? json.docs : []);
      setLoadState("idle");
    } catch {
      if (signal.aborted) return;
      setLoadState("error");
    }
  }, []);

  const fetchComponents = useCallback(async (signal: AbortSignal) => {
    setLoadState("loading");
    try {
      const res = await fetch(
        `/api/${COMPONENTS_SLUG}?limit=200&depth=0&sort=-updatedAt`,
        {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
        },
      );
      if (!res.ok) {
        setLoadState("error");
        return;
      }
      const json = (await res.json()) as { docs?: ComponentRow[] };
      setComponentDocs(Array.isArray(json.docs) ? json.docs : []);
      setLoadState("idle");
    } catch {
      if (signal.aborted) return;
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    if (hubStep.name !== "modify-list") return;
    const ac = new AbortController();
    const { signal } = ac;
    if (hubStep.resource === "templates") {
      if (templateDocs === null) {
        void fetchTemplates(signal);
      } else {
        setLoadState("idle");
      }
    } else if (hubStep.resource === "components") {
      if (componentDocs === null) {
        void fetchComponents(signal);
      } else {
        setLoadState("idle");
      }
    }
    return () => ac.abort();
  }, [hubStep, templateDocs, componentDocs, fetchTemplates, fetchComponents]);

  const filteredTemplates = useMemo(() => {
    const list = templateDocs ?? [];
    const q = modifySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => d.title.toLowerCase().includes(q));
  }, [templateDocs, modifySearch]);

  const filteredComponents = useMemo(() => {
    const list = componentDocs ?? [];
    const q = modifySearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (d) =>
        d.displayName.toLowerCase().includes(q) ||
        (d.key?.toLowerCase().includes(q) ?? false),
    );
  }, [componentDocs, modifySearch]);

  const goBack = () => {
    setModifySearch("");
    if (hubStep.name === "create" || hubStep.name === "modify-pick") {
      setHubStep({ name: "intent" });
      return;
    }
    if (hubStep.name === "modify-list") {
      setHubStep({ name: "modify-pick" });
    }
  };

  const stepIndex =
    hubStep.name === "intent"
      ? 1
      : hubStep.name === "create" || hubStep.name === "modify-pick"
        ? 2
        : 3;
  const stepTotal = 3;

  return (
    <div className={hubViewportClass}>
      <div className={hubStepShellClass}>
        {hubStep.name !== "intent" ? (
          <Button
            className="gap-2 self-start text-muted-foreground motion-safe:transition-colors hover:text-foreground"
            onClick={goBack}
            size="default"
            type="button"
            variant="ghost"
          >
            <IconArrowLeft className="size-4 md:size-5" aria-hidden />
            <span className="text-sm md:text-base">Back</span>
          </Button>
        ) : null}

        <header className="space-y-2 md:space-y-3">
          <p className={hubEyebrowClass}>
            Step {stepIndex} of {stepTotal}
          </p>
          <h1 className={hubTitleClass}>
            {hubStep.name === "intent"
              ? "Builder"
              : hubStep.name === "create"
                ? "Create new"
                : hubStep.name === "modify-pick"
                  ? "Modify existing"
                  : hubStep.resource === "templates"
                    ? "Page templates"
                    : "Components"}
          </h1>
          <p className={hubLeadClass}>
            {hubStep.name === "intent"
              ? "Choose whether to start something new or open work you already have."
              : hubStep.name === "create"
                ? "Start from Payload; you can open the visual builder from the document when you are ready."
                : hubStep.name === "modify-pick"
                  ? "Pick whether you are working with full-page templates or library components."
                  : "Search, then edit in admin or jump straight into the builder."}
          </p>
        </header>

        {hubStep.name === "intent" ? (
          <div className={hubTileGridClass}>
            <HubChoiceButton
              description="Blank page template or component in Payload, then build."
              icon={<IconPlus className={tileIconClass} aria-hidden />}
              title="Create new"
              onClick={() => setHubStep({ name: "create" })}
            />
            <HubChoiceButton
              description="Jump into the builder for something that already exists."
              icon={<IconEdit className={tileIconClass} aria-hidden />}
              title="Modify existing"
              onClick={() => setHubStep({ name: "modify-pick" })}
            />
          </div>
        ) : null}

        {hubStep.name === "create" ? (
          <div className={hubTileGridClass}>
            <HubChoiceLink
              description="Layouts you assign when creating pages."
              href={createTemplateHref}
              icon={<IconLayout className={tileIconClass} aria-hidden />}
              title="Page template"
            />
            <HubChoiceLink
              description="Reusable blocks for the library and editor."
              href={createComponentHref}
              icon={<IconPuzzle className={tileIconClass} aria-hidden />}
              title="Component"
            />
          </div>
        ) : null}

        {hubStep.name === "modify-pick" ? (
          <div className={hubTileGridClass}>
            <HubChoiceButton
              description="Full-page layouts from the builder."
              icon={<IconLayout className={tileIconClass} aria-hidden />}
              title="Page templates"
              onClick={() =>
                setHubStep({ name: "modify-list", resource: "templates" })
              }
            />
            <HubChoiceButton
              description="Components in your library."
              icon={<IconPuzzle className={tileIconClass} aria-hidden />}
              title="Components"
              onClick={() =>
                setHubStep({ name: "modify-list", resource: "components" })
              }
            />
          </div>
        ) : null}

        {hubStep.name === "modify-list" ? (
          <div className={hubPanelClass}>
            <div className="space-y-2 md:space-y-2.5">
              <Label
                className={hubFilterLabelClass}
                htmlFor="builder-hub-search"
              >
                Filter
              </Label>
              <div className="relative">
                <IconSearch
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground md:left-3.5 md:size-5"
                  aria-hidden
                />
                <Input
                  id="builder-hub-search"
                  type="search"
                  placeholder="Search by title or key…"
                  value={modifySearch}
                  onChange={(e) => setModifySearch(e.target.value)}
                  autoComplete="off"
                  className={cn(
                    hubInputClass,
                    "placeholder:text-muted-foreground/90",
                  )}
                />
              </div>
            </div>

            {loadState === "loading" ? (
              <p className="py-8 text-center text-sm text-muted-foreground md:py-10 md:text-base">
                Loading…
              </p>
            ) : null}
            {loadState === "error" ? (
              <p className="border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive md:px-5 md:py-3.5 md:text-base">
                Could not load this list. Try again or use the sidebar
                collections.
              </p>
            ) : null}

            {hubStep.resource === "templates" ? (
              <ModifyResourceList
                adminRoute={adminRoute}
                emptyCtaLabel="Create a template"
                emptyHref={createTemplateHref}
                loadState={loadState}
                resource="templates"
                rows={filteredTemplates}
              />
            ) : (
              <ModifyResourceList
                adminRoute={adminRoute}
                emptyCtaLabel="Create a component"
                emptyHref={createComponentHref}
                loadState={loadState}
                resource="components"
                rows={filteredComponents}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
