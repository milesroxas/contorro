"use client";

import {
  studioNewCompositionSessionId,
  studioRowIdForComponent,
} from "@repo/domains-composition";
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
import type { ComponentProps, ComponentType } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ScrollArea } from "../components/scroll-area.js";
import { Button } from "../components/ui/button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import { Separator } from "../components/ui/separator.js";
import { cn } from "../lib/cn.js";
import { COMPONENTS_SLUG, PAGE_COMPOSITIONS_SLUG } from "./hub/constants.js";
import { formatUpdatedAt } from "./hub/formatters.js";
import { useStudioDocumentTheme } from "./hub/use-studio-document-theme.js";
import {
  adminCollectionsIndexHref,
  adminDocumentHref,
} from "./lib/admin-hrefs.js";

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
  const hasSecondaryAction = Boolean(secondaryAction);

  return (
    <div className="flex h-full flex-col justify-between gap-4 rounded-lg bg-card p-4 shadow-sm">
      <div className="space-y-2">
        <div className="inline-flex size-9 items-center justify-center rounded-md bg-muted/60">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={cn(
          "grid w-full gap-2 pt-1 [&>[data-slot=button]]:w-full [&>[data-slot=button]]:justify-center",
          hasSecondaryAction ? "grid-cols-2" : "grid-cols-1",
        )}
      >
        {secondaryAction ? (
          <Button asChild size="xs" variant="secondary">
            <Link href={secondaryAction.href} prefetch={false}>
              {secondaryAction.label}
            </Link>
          </Button>
        ) : null}
        {primaryAction.href ? (
          <Button
            asChild
            size="xs"
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
            onClick={primaryAction.onClick}
            size="xs"
            type="button"
            variant={primaryAction.variant ?? "default"}
          >
            {PrimaryIcon ? (
              <PrimaryIcon className="size-3.5" aria-hidden />
            ) : null}
            {primaryAction.label}
          </Button>
        )}
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
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-card ring-0">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="size-4" aria-hidden />
            {title}
          </CardTitle>
          <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {rows.length}
          </span>
        </div>
        <div className="relative">
          <IconSearch
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            className="h-9 border-input bg-background pl-9 shadow-sm"
            placeholder={searchPlaceholder}
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="w-full space-y-2 pr-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading {title.toLowerCase()}...
              </p>
            ) : rows.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{emptyMessage}</p>
                <Button asChild size="xs" variant="link">
                  <Link href={emptyHref} prefetch={false}>
                    {emptyCtaLabel}
                  </Link>
                </Button>
              </div>
            ) : (
              <ul className="w-full space-y-2.5">
                {rows.map((row) => (
                  <li
                    className="w-full space-y-2.5 rounded-lg border border-border/70 bg-card/80 p-3 shadow-sm transition-colors hover:bg-accent/40"
                    key={`${row.resourceType}-${row.id}`}
                  >
                    <div className="space-y-1">
                      <p className="truncate text-sm font-semibold text-foreground md:text-base">
                        {row.title}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.meta}
                      </p>
                    </div>
                    <Separator className="bg-border/70" />
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="xs" variant="outline">
                        <Link href={row.editHref} prefetch={false}>
                          Edit
                        </Link>
                      </Button>
                      <Button asChild size="xs">
                        <Link href={row.studioHref} prefetch={false}>
                          Studio
                          <IconExternalLink className="size-3.5" aria-hidden />
                        </Link>
                      </Button>
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

export type StudioDashboardProps = {
  adminRoute: string;
};

export default function StudioDashboard({ adminRoute }: StudioDashboardProps) {
  const router = useRouter();
  const { setTheme, theme } = useStudioDocumentTheme();

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
      const tempId = studioNewCompositionSessionId(kind);
      const studioHref = `/studio?composition=${encodeURIComponent(tempId)}`;
      router.push(studioHref);
    },
    [router],
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
            cache: "no-store",
            credentials: "include",
            headers: { Accept: "application/json" },
            signal,
          },
        ),
        fetch(`/api/${COMPONENTS_SLUG}?limit=200&depth=0&sort=-updatedAt`, {
          cache: "no-store",
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

  useEffect(() => {
    const onFocus = () => {
      void fetchDashboardData();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void fetchDashboardData();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchDashboardData]);

  const templateCollectionHref = useMemo(
    () => adminCollectionsIndexHref(adminRoute, PAGE_COMPOSITIONS_SLUG),
    [adminRoute],
  );
  const componentCollectionHref = useMemo(
    () => adminCollectionsIndexHref(adminRoute, COMPONENTS_SLUG),
    [adminRoute],
  );
  const designSystemHref = "/studio?screen=design-system";

  const templateRows = useMemo<ResourceListRow[]>(() => {
    const docs = templateDocs ?? [];
    return docs.map((doc) => {
      const id = String(doc.id);
      const updatedAtLabel = formatUpdatedAt(doc.updatedAt);
      const meta = [publicationStatusLabel(doc._status), updatedAtLabel]
        .filter(Boolean)
        .join(" · ");
      return {
        studioHref: `/studio?composition=${encodeURIComponent(id)}`,
        editHref: adminDocumentHref(adminRoute, PAGE_COMPOSITIONS_SLUG, id),
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
        studioHref: `/studio?composition=${encodeURIComponent(studioRowIdForComponent(id))}`,
        editHref: adminDocumentHref(adminRoute, COMPONENTS_SLUG, id),
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
          label: "New",
          onClick: createTemplateAndOpenStudio,
        },
        secondaryAction: {
          href: templateCollectionHref,
          label: "View All",
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
          label: "New",
          onClick: createComponentAndOpenStudio,
        },
        secondaryAction: {
          href: componentCollectionHref,
          label: "View All",
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
          label: "Design system",
        },
        title: "Design system",
      },
    ],
    [
      componentCollectionHref,
      createComponentAndOpenStudio,
      createTemplateAndOpenStudio,
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
    <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto px-4 py-4 md:px-6 md:py-5 xl:px-8 lg:overflow-hidden">
      <header className="shrink-0 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
          <div className="inline-flex items-center rounded-md bg-muted/40 p-1">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isActive = currentTheme === option.value;
              return (
                <Button
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
          <Button onClick={refreshDashboard} type="button" variant="secondary">
            <IconRefresh className="size-4" aria-hidden />
            Refresh
          </Button>
        </div>
      </header>
      {isError ? (
        <p className="mt-4 shrink-0 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load dashboard data. Click refresh and try again.
        </p>
      ) : null}
      <div className="grid gap-4 pt-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)] xl:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)] lg:min-h-0 lg:flex-1">
        <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
          <Card className="shrink-0 rounded-lg bg-card ring-0">
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

          <section className="flex flex-col gap-4 md:flex-row md:items-stretch lg:min-h-0 lg:flex-1">
            <ResourceListCard
              emptyCtaLabel="View templates"
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
            <Separator className="bg-border/70 md:h-auto md:w-px md:self-stretch" />

            <ResourceListCard
              emptyCtaLabel="View components"
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

        <div className="flex flex-col gap-4 lg:min-h-0 lg:overflow-hidden">
          <Card className="shrink-0 rounded-lg bg-card ring-0">
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Workspace health</CardTitle>
              <CardDescription>
                Keep a quick pulse on content volume and publication readiness.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-2 gap-2">
                {overviewStats.map((item) => (
                  <div
                    className="space-y-1 bg-muted/30 px-3 py-2"
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
                <Button asChild size="xs" variant="link">
                  <Link href={templateCollectionHref} prefetch={false}>
                    Templates
                  </Link>
                </Button>
                <Button asChild size="xs" variant="link">
                  <Link href={componentCollectionHref} prefetch={false}>
                    Components
                  </Link>
                </Button>
                <Button asChild size="xs" variant="link">
                  <Link href={designSystemHref} prefetch={false}>
                    Design system
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-card ring-0">
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
            <CardContent className="min-h-0 flex-1">
              <ScrollArea className="h-full">
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
                    <ul className="grid gap-2">
                      {recentRows.map((row) => (
                        <li
                          className="flex h-full flex-col justify-between gap-3 rounded-md bg-muted/15 p-3 [&>[data-slot=button]]:w-full [&>[data-slot=button]]:justify-start"
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
                          <Button asChild size="xs" variant="default">
                            <Link href={row.studioHref} prefetch={false}>
                              Open
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
        </div>
      </div>
    </main>
  );
}
