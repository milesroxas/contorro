"use client";

import { useConfig } from "@payloadcms/ui";
import {
  IconExternalLink,
  IconLayout,
  IconLoader2,
  IconPlus,
  IconPuzzle,
  IconRefresh,
  IconSearch,
} from "@tabler/icons-react";
import { builderRowIdForComponent } from "@repo/infrastructure-payload-config/builder-row-id";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import { useCallback, useEffect, useMemo, useState } from "react";

import { COMPONENTS_SLUG, PAGE_COMPOSITIONS_SLUG } from "./constants";
import { formatUpdatedAt } from "./formatters";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

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

export default function BuilderHub() {
  const router = useRouter();
  const { config } = useConfig();
  const adminRoute = config.routes?.admin ?? "/admin";

  const [templateDocs, setTemplateDocs] = useState<PageTemplateRow[] | null>(
    null,
  );
  const [componentDocs, setComponentDocs] = useState<ComponentRow[] | null>(
    null,
  );
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [templateSearch, setTemplateSearch] = useState("");
  const [componentSearch, setComponentSearch] = useState("");
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [createTemplateError, setCreateTemplateError] = useState("");
  const [isCreatingComponent, setIsCreatingComponent] = useState(false);
  const [createComponentError, setCreateComponentError] = useState("");

  const createTemplateAndOpenBuilder = useCallback(async () => {
    if (isCreatingTemplate) return;
    setCreateTemplateError("");
    setIsCreatingTemplate(true);

    try {
      const res = await fetch("/api/builder/compositions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled page template" }),
      });

      if (!res.ok) {
        setCreateTemplateError("Could not create template. Try again.");
        return;
      }

      const json = (await res.json()) as { data?: { id?: string } };
      const id = json.data?.id;

      if (!id) {
        setCreateTemplateError("Could not create template. Try again.");
        return;
      }

      const builderHref = formatAdminURL({
        adminRoute,
        path: `/builder?composition=${encodeURIComponent(id)}`,
        relative: true,
      });
      router.push(builderHref);
    } catch {
      setCreateTemplateError("Could not create template. Try again.");
    } finally {
      setIsCreatingTemplate(false);
    }
  }, [adminRoute, isCreatingTemplate, router]);

  const createComponentAndOpenBuilder = useCallback(async () => {
    if (isCreatingComponent) return;
    setCreateComponentError("");
    setIsCreatingComponent(true);

    try {
      const res = await fetch("/api/builder/compositions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "component",
          title: "Untitled component",
        }),
      });

      if (!res.ok) {
        setCreateComponentError("Could not create component. Try again.");
        return;
      }

      const json = (await res.json()) as { data?: { id?: string } };
      const id = json.data?.id;

      if (!id) {
        setCreateComponentError("Could not create component. Try again.");
        return;
      }

      const builderHref = formatAdminURL({
        adminRoute,
        path: `/builder?composition=${encodeURIComponent(id)}`,
        relative: true,
      });
      router.push(builderHref);
    } catch {
      setCreateComponentError("Could not create component. Try again.");
    } finally {
      setIsCreatingComponent(false);
    }
  }, [adminRoute, isCreatingComponent, router]);

  const fetchDashboardData = useCallback(async (signal: AbortSignal) => {
    setLoadState("loading");

    try {
      const [templatesRes, componentsRes] = await Promise.all([
        fetch(`/api/${PAGE_COMPOSITIONS_SLUG}?limit=200&depth=0&sort=-updatedAt`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
        }),
        fetch(`/api/${COMPONENTS_SLUG}?limit=200&depth=0&sort=-updatedAt`, {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal,
        }),
      ]);

      if (!templatesRes.ok || !componentsRes.ok) {
        setLoadState("error");
        return;
      }

      const templatesJson = (await templatesRes.json()) as {
        docs?: PageTemplateRow[];
      };
      const componentsJson = (await componentsRes.json()) as {
        docs?: ComponentRow[];
      };

      setTemplateDocs(Array.isArray(templatesJson.docs) ? templatesJson.docs : []);
      setComponentDocs(
        Array.isArray(componentsJson.docs) ? componentsJson.docs : [],
      );
      setLoadState("idle");
    } catch {
      if (signal.aborted) return;
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    void fetchDashboardData(ac.signal);
    return () => ac.abort();
  }, [fetchDashboardData]);

  const filteredTemplates = useMemo(() => {
    const list = templateDocs ?? [];
    const query = templateSearch.trim().toLowerCase();
    if (!query) return list;
    return list.filter((doc) => doc.title.toLowerCase().includes(query));
  }, [templateDocs, templateSearch]);

  const filteredComponents = useMemo(() => {
    const list = componentDocs ?? [];
    const query = componentSearch.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (doc) =>
        doc.displayName.toLowerCase().includes(query) ||
        (doc.key?.toLowerCase().includes(query) ?? false),
    );
  }, [componentDocs, componentSearch]);

  const templateCollectionHref = formatAdminURL({
    adminRoute,
    path: `/collections/${PAGE_COMPOSITIONS_SLUG}`,
    relative: true,
  });
  const componentCollectionHref = formatAdminURL({
    adminRoute,
    path: `/collections/${COMPONENTS_SLUG}`,
    relative: true,
  });

  const templateEditHref = (id: string) =>
    formatAdminURL({
      adminRoute,
      path: `/collections/${PAGE_COMPOSITIONS_SLUG}/${encodeURIComponent(id)}`,
      relative: true,
    });
  const templateBuilderHref = (id: string) =>
    formatAdminURL({
      adminRoute,
      path: `/builder?composition=${encodeURIComponent(id)}`,
      relative: true,
    });
  const componentEditHref = (id: string) =>
    formatAdminURL({
      adminRoute,
      path: `/collections/${COMPONENTS_SLUG}/${encodeURIComponent(id)}`,
      relative: true,
    });
  const componentBuilderHref = (id: string) =>
    formatAdminURL({
      adminRoute,
      path: `/builder?composition=${encodeURIComponent(builderRowIdForComponent(id))}`,
      relative: true,
    });

  const isLoading = loadState === "loading";
  const isError = loadState === "error";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Builder dashboard
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Manage page templates and components from one place.
          </p>
        </div>
        <Button
          className="gap-2 self-start"
          onClick={() => {
            const ac = new AbortController();
            void fetchDashboardData(ac.signal);
          }}
          type="button"
          variant="outline"
        >
          <IconRefresh className="size-4" aria-hidden />
          Refresh
        </Button>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconLayout className="size-5" aria-hidden />
              Page templates
            </CardTitle>
            <CardDescription>
              Create new page template and open builder immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full gap-2 sm:w-auto"
              disabled={isCreatingTemplate}
              onClick={() => {
                void createTemplateAndOpenBuilder();
              }}
              type="button"
            >
              {isCreatingTemplate ? (
                <IconLoader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <IconPlus className="size-4" aria-hidden />
              )}
              {isCreatingTemplate ? "Creating..." : "Create template"}
            </Button>
            {createTemplateError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createTemplateError}
              </p>
            ) : null}
            <Button asChild variant="ghost">
              <Link href={templateCollectionHref} prefetch={false}>
                Open templates collection
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconPuzzle className="size-5" aria-hidden />
              Components
            </CardTitle>
            <CardDescription>
              Create reusable component and open builder immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full gap-2 sm:w-auto"
              disabled={isCreatingComponent}
              onClick={() => {
                void createComponentAndOpenBuilder();
              }}
              type="button"
            >
              {isCreatingComponent ? (
                <IconLoader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <IconPlus className="size-4" aria-hidden />
              )}
              {isCreatingComponent ? "Creating..." : "Create component"}
            </Button>
            {createComponentError ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {createComponentError}
              </p>
            ) : null}
            <Button asChild variant="ghost">
              <Link href={componentCollectionHref} prefetch={false}>
                Open components collection
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {isError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load dashboard data. Click refresh and try again.
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="min-h-[22rem]">
          <CardHeader className="gap-3">
            <CardTitle className="text-lg">Templates</CardTitle>
            <div className="relative">
              <IconSearch
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                className="pl-9"
                placeholder="Search templates..."
                type="search"
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading templates...</p>
            ) : filteredTemplates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No templates found.</p>
            ) : (
              <ul className="space-y-2">
                {filteredTemplates.map((template, index) => {
                  const id = String(template.id);
                  const updated = formatUpdatedAt(template.updatedAt);
                  return (
                    <li key={id}>
                      {index > 0 ? <Separator className="mb-2" /> : null}
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="truncate text-sm font-medium md:text-base">
                            {template.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {template._status === "draft" ? "Draft" : "Published"}
                            {updated ? ` · ${updated}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={templateEditHref(id)} prefetch={false}>
                              Edit
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link
                              className="inline-flex items-center gap-1.5"
                              href={templateBuilderHref(id)}
                              prefetch={false}
                            >
                              Open builder
                              <IconExternalLink className="size-3.5" aria-hidden />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-h-[22rem]">
          <CardHeader className="gap-3">
            <CardTitle className="text-lg">Components</CardTitle>
            <div className="relative">
              <IconSearch
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                className="pl-9"
                placeholder="Search components..."
                type="search"
                value={componentSearch}
                onChange={(event) => setComponentSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading components...</p>
            ) : filteredComponents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No components found.</p>
            ) : (
              <ul className="space-y-2">
                {filteredComponents.map((component, index) => {
                  const id = String(component.id);
                  const updated = formatUpdatedAt(component.updatedAt);
                  return (
                    <li key={id}>
                      {index > 0 ? <Separator className="mb-2" /> : null}
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="truncate text-sm font-medium md:text-base">
                            {component.displayName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {component.key ? `${component.key} · ` : ""}
                            {component._status === "draft" ? "Draft" : "Published"}
                            {updated ? ` · ${updated}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={componentEditHref(id)} prefetch={false}>
                              Edit
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link
                              className="inline-flex items-center gap-1.5"
                              href={componentBuilderHref(id)}
                              prefetch={false}
                            >
                              Open builder
                              <IconExternalLink className="size-3.5" aria-hidden />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
