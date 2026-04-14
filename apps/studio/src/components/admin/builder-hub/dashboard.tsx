"use client";

import { useConfig, useTheme } from "@payloadcms/ui";
import { builderNewCompositionSessionId } from "@repo/domains-composition";
import { builderRowIdForComponent } from "@repo/infrastructure-payload-config/builder-row-id";
import {
  IconClock,
  IconExternalLink,
  IconLayout,
  IconMoon,
  IconPalette,
  IconPlus,
  IconPuzzle,
  IconRefresh,
  IconSearch,
  IconSun,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import type { ComponentProps, ComponentType } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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

type DashboardLoadState = "idle" | "loading" | "error";
type ThemeValue = "light" | "dark";
type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
type ButtonVariant = ComponentProps<typeof Button>["variant"];

type ResourceListRow = {
  id: string;
  title: string;
  meta: string;
  editHref: string;
  studioHref: string;
  searchText: string;
  updatedAtValue: number;
  updatedAtLabel: string;
  resourceType: "Template" | "Component";
};

type QuickAction = {
  id: string;
  title: string;
  description: string;
  icon: IconType;
  primaryAction: {
    label: string;
    href?: string;
    onClick?: () => void;
    icon?: IconType;
    variant?: ButtonVariant;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
};

const THEME_OPTIONS: ReadonlyArray<{
  value: ThemeValue;
  label: string;
  icon: IconType;
}> = [
  { icon: IconSun, label: "Light", value: "light" },
  { icon: IconMoon, label: "Dark", value: "dark" },
];

function toUpdatedAtValue(iso?: string): number {
  if (!iso) return 0;
  const value = Date.parse(iso);
  return Number.isFinite(value) ? value : 0;
}

function publicationStatusLabel(status?: string | null): string {
  return status === "draft" ? "Draft" : "Published";
}

function filterRows(
  rows: ResourceListRow[],
  search: string,
): ResourceListRow[] {
  const query = search.trim().toLowerCase();
  if (!query) return rows;
  return rows.filter((row) => row.searchText.includes(query));
}

type QuickActionCardProps = {
  title: string;
  description: string;
  icon: IconType;
  primaryAction: QuickAction["primaryAction"];
  secondaryAction?: QuickAction["secondaryAction"];
};

function QuickActionCard({
  title,
  description,
  icon: Icon,
  primaryAction,
  secondaryAction,
}: QuickActionCardProps) {
  const PrimaryIcon = primaryAction.icon;

  return (
    <div className="flex h-full flex-col justify-between gap-5 border border-border bg-muted/25 p-4">
      <div className="space-y-2">
        <div className="inline-flex size-8 items-center justify-center border border-border bg-background">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {primaryAction.href ? (
          <Button
            asChild
            className="w-full justify-start gap-1.5 sm:w-auto"
            variant={primaryAction.variant ?? "default"}
          >
            <Link href={primaryAction.href} prefetch={false}>
              {PrimaryIcon ? (
                <PrimaryIcon className="size-3.5" aria-hidden />
              ) : null}
              {primaryAction.label}
            </Link>
          </Button>
        ) : (
          <Button
            className="w-full justify-start gap-1.5 sm:w-auto"
            onClick={primaryAction.onClick}
            type="button"
            variant={primaryAction.variant ?? "default"}
          >
            {PrimaryIcon ? (
              <PrimaryIcon className="size-3.5" aria-hidden />
            ) : null}
            {primaryAction.label}
          </Button>
        )}
        {secondaryAction ? (
          <Button
            asChild
            className="w-full justify-start sm:w-auto"
            variant="ghost"
          >
            <Link href={secondaryAction.href} prefetch={false}>
              {secondaryAction.label}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

type ResourceListCardProps = {
  title: string;
  icon: IconType;
  rows: ResourceListRow[];
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  loadState: DashboardLoadState;
  emptyMessage: string;
  emptyHref: string;
  emptyCtaLabel: string;
};

function ResourceListCard({
  title,
  icon: Icon,
  rows,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  loadState,
  emptyMessage,
  emptyHref,
  emptyCtaLabel,
}: ResourceListCardProps) {
  const isLoading = loadState === "loading";

  return (
    <Card className="flex min-h-[22rem] flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="size-4" aria-hidden />
            {title}
          </CardTitle>
          <span className="inline-flex min-w-7 items-center justify-center border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {rows.length}
          </span>
        </div>
        <div className="relative">
          <IconSearch
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="h-9 pl-9"
            placeholder={searchPlaceholder}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="space-y-2 pr-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading {title.toLowerCase()}...
              </p>
            ) : rows.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                <Button asChild className="h-auto px-0" variant="link">
                  <Link href={emptyHref} prefetch={false}>
                    {emptyCtaLabel}
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {rows.map((row, index) => (
                  <li key={`${row.resourceType}-${row.id}`}>
                    {index > 0 ? <Separator className="mb-2" /> : null}
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <p className="truncate text-sm font-medium md:text-base">
                          {row.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.meta}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={row.editHref} prefetch={false}>
                            Edit
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link
                            className="inline-flex items-center gap-1.5"
                            href={row.studioHref}
                            prefetch={false}
                          >
                            Open studio
                            <IconExternalLink
                              className="size-3.5"
                              aria-hidden
                            />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default function StudioDashboard() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { config } = useConfig();
  const adminRoute = config.routes?.admin ?? "/admin";

  const [templateDocs, setTemplateDocs] = useState<PageTemplateRow[] | null>(
    null,
  );
  const [componentDocs, setComponentDocs] = useState<ComponentRow[] | null>(
    null,
  );
  const [loadState, setLoadState] = useState<DashboardLoadState>("idle");
  const [templateSearch, setTemplateSearch] = useState("");
  const [componentSearch, setComponentSearch] = useState("");

  const openNewStudioSession = useCallback(
    (kind: "template" | "component") => {
      const tempId = builderNewCompositionSessionId(kind);
      const studioHref = formatAdminURL({
        adminRoute,
        path: `/studio?composition=${encodeURIComponent(tempId)}`,
        relative: true,
      });
      router.push(studioHref);
    },
    [adminRoute, router],
  );

  const createTemplateAndOpenStudio = useCallback(() => {
    openNewStudioSession("template");
  }, [openNewStudioSession]);

  const createComponentAndOpenStudio = useCallback(() => {
    openNewStudioSession("component");
  }, [openNewStudioSession]);

  const fetchDashboardData = useCallback(async (signal?: AbortSignal) => {
    setLoadState("loading");

    try {
      const [templatesRes, componentsRes] = await Promise.all([
        fetch(
          `/api/${PAGE_COMPOSITIONS_SLUG}?limit=200&depth=0&sort=-updatedAt`,
          {
            credentials: "include",
            headers: { Accept: "application/json" },
            signal,
          },
        ),
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

      setTemplateDocs(
        Array.isArray(templatesJson.docs) ? templatesJson.docs : [],
      );
      setComponentDocs(
        Array.isArray(componentsJson.docs) ? componentsJson.docs : [],
      );
      setLoadState("idle");
    } catch {
      if (signal?.aborted) return;
      setLoadState("error");
    }
  }, []);

  const refreshDashboard = useCallback(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const ac = new AbortController();
    void fetchDashboardData(ac.signal);
    return () => ac.abort();
  }, [fetchDashboardData]);

  const templateCollectionHref = useMemo(
    () =>
      formatAdminURL({
        adminRoute,
        path: `/collections/${PAGE_COMPOSITIONS_SLUG}`,
        relative: true,
      }),
    [adminRoute],
  );
  const componentCollectionHref = useMemo(
    () =>
      formatAdminURL({
        adminRoute,
        path: `/collections/${COMPONENTS_SLUG}`,
        relative: true,
      }),
    [adminRoute],
  );
  const designSystemHref = useMemo(
    () =>
      formatAdminURL({
        adminRoute,
        path: "/studio?screen=design-system",
        relative: true,
      }),
    [adminRoute],
  );

  const templateRows = useMemo<ResourceListRow[]>(() => {
    const docs = templateDocs ?? [];
    return docs.map((doc) => {
      const id = String(doc.id);
      const updatedAtLabel = formatUpdatedAt(doc.updatedAt);
      const meta = [publicationStatusLabel(doc._status), updatedAtLabel]
        .filter(Boolean)
        .join(" · ");
      return {
        studioHref: formatAdminURL({
          adminRoute,
          path: `/studio?composition=${encodeURIComponent(id)}`,
          relative: true,
        }),
        editHref: formatAdminURL({
          adminRoute,
          path: `/collections/${PAGE_COMPOSITIONS_SLUG}/${encodeURIComponent(id)}`,
          relative: true,
        }),
        id,
        meta,
        resourceType: "Template",
        searchText: doc.title.toLowerCase(),
        title: doc.title,
        updatedAtLabel,
        updatedAtValue: toUpdatedAtValue(doc.updatedAt),
      };
    });
  }, [adminRoute, templateDocs]);

  const componentRows = useMemo<ResourceListRow[]>(() => {
    const docs = componentDocs ?? [];
    return docs.map((doc) => {
      const id = String(doc.id);
      const updatedAtLabel = formatUpdatedAt(doc.updatedAt);
      const meta = [
        doc.key,
        publicationStatusLabel(doc._status),
        updatedAtLabel,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        studioHref: formatAdminURL({
          adminRoute,
          path: `/studio?composition=${encodeURIComponent(builderRowIdForComponent(id))}`,
          relative: true,
        }),
        editHref: formatAdminURL({
          adminRoute,
          path: `/collections/${COMPONENTS_SLUG}/${encodeURIComponent(id)}`,
          relative: true,
        }),
        id,
        meta,
        resourceType: "Component",
        searchText: `${doc.displayName} ${doc.key ?? ""}`.toLowerCase(),
        title: doc.displayName,
        updatedAtLabel,
        updatedAtValue: toUpdatedAtValue(doc.updatedAt),
      };
    });
  }, [adminRoute, componentDocs]);

  const filteredTemplateRows = useMemo(
    () => filterRows(templateRows, templateSearch),
    [templateRows, templateSearch],
  );
  const filteredComponentRows = useMemo(
    () => filterRows(componentRows, componentSearch),
    [componentRows, componentSearch],
  );

  const recentRows = useMemo(
    () =>
      [...templateRows, ...componentRows]
        .sort((left, right) => right.updatedAtValue - left.updatedAtValue)
        .slice(0, 6),
    [componentRows, templateRows],
  );

  const templateCount = templateRows.length;
  const componentCount = componentRows.length;
  const draftCount = useMemo(() => {
    const templateDrafts =
      templateDocs?.filter((doc) => doc._status === "draft").length ?? 0;
    const componentDrafts =
      componentDocs?.filter((doc) => doc._status === "draft").length ?? 0;
    return templateDrafts + componentDrafts;
  }, [componentDocs, templateDocs]);
  const publishedCount = templateCount + componentCount - draftCount;

  const quickActions = useMemo<QuickAction[]>(
    () => [
      {
        description:
          "Create a new page template and jump directly into Studio.",
        icon: IconLayout,
        id: "templates",
        primaryAction: {
          icon: IconPlus,
          label: "Create template",
          onClick: createTemplateAndOpenStudio,
        },
        secondaryAction: {
          href: templateCollectionHref,
          label: "Open templates collection",
        },
        title: "Page templates",
      },
      {
        description:
          "Start a reusable component and refine it in the same Studio flow.",
        icon: IconPuzzle,
        id: "components",
        primaryAction: {
          icon: IconPlus,
          label: "Create component",
          onClick: createComponentAndOpenStudio,
        },
        secondaryAction: {
          href: componentCollectionHref,
          label: "Open components collection",
        },
        title: "Components",
      },
      {
        description:
          "Update design tokens and preview changes with the design system screen.",
        icon: IconPalette,
        id: "design-system",
        primaryAction: {
          href: designSystemHref,
          icon: IconExternalLink,
          label: "Open design system",
          variant: "secondary",
        },
        title: "Design system",
      },
    ],
    [
      componentCollectionHref,
      createComponentAndOpenStudio,
      createTemplateAndOpenStudio,
      designSystemHref,
      templateCollectionHref,
    ],
  );

  const currentTheme: ThemeValue = theme === "dark" ? "dark" : "light";
  const latestUpdated = recentRows.find(
    (row) => row.updatedAtLabel,
  )?.updatedAtLabel;

  const overviewStats = [
    { label: "Templates", value: templateCount },
    { label: "Components", value: componentCount },
    { label: "Drafts", value: draftCount },
    { label: "Published", value: publishedCount },
  ];

  const isError = loadState === "error";

  return (
    <main className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col gap-6 px-4 py-6 md:gap-8 md:px-6 md:py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Workspace
          </p>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Studio
          </h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Create, iterate, and publish templates, components, and design
            tokens from one dashboard.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center border border-border bg-muted/40 p-1">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = currentTheme === option.value;
              return (
                <Button
                  className={cn(
                    "h-7 gap-1.5 px-2.5",
                    !isActive && "text-muted-foreground",
                  )}
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  size="sm"
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {option.label}
                </Button>
              );
            })}
          </div>
          <Button
            className="gap-2"
            onClick={refreshDashboard}
            type="button"
            variant="outline"
          >
            <IconRefresh className="size-4" aria-hidden />
            Refresh
          </Button>
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-6 pr-3 md:gap-8">
          <section className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Quick actions</CardTitle>
                <CardDescription>
                  Clear entry points for your three core workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {quickActions.map((action) => (
                  <QuickActionCard
                    description={action.description}
                    icon={action.icon}
                    key={action.id}
                    primaryAction={action.primaryAction}
                    secondaryAction={action.secondaryAction}
                    title={action.title}
                  />
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-lg">Workspace health</CardTitle>
                <CardDescription>
                  Keep a quick pulse on content volume and publication
                  readiness.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="grid grid-cols-2 gap-2">
                  {overviewStats.map((item) => (
                    <div
                      className="space-y-1 border border-border bg-muted/30 px-3 py-2"
                      key={item.label}
                    >
                      <dt className="text-[11px] text-muted-foreground">
                        {item.label}
                      </dt>
                      <dd className="text-base font-medium text-foreground">
                        {item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {latestUpdated ? (
                  <p className="text-xs text-muted-foreground">
                    Last activity: {latestUpdated}
                  </p>
                ) : null}
                <Separator />
                <div className="flex flex-col gap-1">
                  <Button asChild className="justify-start" variant="ghost">
                    <Link href={templateCollectionHref} prefetch={false}>
                      Manage templates
                    </Link>
                  </Button>
                  <Button asChild className="justify-start" variant="ghost">
                    <Link href={componentCollectionHref} prefetch={false}>
                      Manage components
                    </Link>
                  </Button>
                  <Button asChild className="justify-start" variant="ghost">
                    <Link href={designSystemHref} prefetch={false}>
                      Open design system
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {isError ? (
            <p className="rounded-none border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Could not load dashboard data. Click refresh and try again.
            </p>
          ) : null}

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <IconClock className="size-4" aria-hidden />
                Continue where you left off
              </CardTitle>
              <CardDescription>
                Jump back into your most recently updated templates and
                components.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-80">
                <div className="pr-3">
                  {loadState === "loading" ? (
                    <p className="text-sm text-muted-foreground">
                      Loading recent work...
                    </p>
                  ) : recentRows.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No recent items yet. Start from quick actions above.
                    </p>
                  ) : (
                    <ul className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                      {recentRows.map((row) => (
                        <li
                          className="flex h-full flex-col justify-between gap-3 border border-border bg-muted/20 p-3"
                          key={`recent-${row.resourceType}-${row.id}`}
                        >
                          <div className="space-y-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {row.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.resourceType} · {row.meta}
                            </p>
                          </div>
                          <Button
                            asChild
                            className="w-full justify-start"
                            size="sm"
                            variant="outline"
                          >
                            <Link href={row.studioHref} prefetch={false}>
                              Open studio
                            </Link>
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <section className="grid gap-4 lg:grid-cols-2">
            <ResourceListCard
              emptyCtaLabel="Open templates collection"
              emptyHref={templateCollectionHref}
              emptyMessage={
                templateRows.length === 0
                  ? "No templates yet."
                  : "No templates match your search."
              }
              icon={IconLayout}
              loadState={loadState}
              onSearchChange={setTemplateSearch}
              rows={filteredTemplateRows}
              searchPlaceholder="Search templates..."
              searchValue={templateSearch}
              title="Templates"
            />

            <ResourceListCard
              emptyCtaLabel="Open components collection"
              emptyHref={componentCollectionHref}
              emptyMessage={
                componentRows.length === 0
                  ? "No components yet."
                  : "No components match your search."
              }
              icon={IconPuzzle}
              loadState={loadState}
              onSearchChange={setComponentSearch}
              rows={filteredComponentRows}
              searchPlaceholder="Search components..."
              searchValue={componentSearch}
              title="Components"
            />
          </section>
        </div>
      </ScrollArea>
    </main>
  );
}
