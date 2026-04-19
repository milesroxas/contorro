"use client";

import {
  IconLayout,
  IconPlus,
  IconPuzzle,
  IconSearch,
} from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card.js";
import { Input } from "../components/ui/input.js";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "../components/ui/item.js";
import { ScrollArea } from "../components/ui/scroll-area.js";
import { fetchPageCompositionSummaries } from "../lib/fetch-page-composition-summaries.js";
import { COMPONENTS_SLUG } from "./hub/constants.js";
import { formatUpdatedAt } from "./hub/formatters.js";
import {
  type StudioCollectionScreen,
  studioHrefForComponentDocument,
  studioHrefForComposition,
  studioHrefForNewSession,
} from "./studio-navigation.js";

type StudioCollectionViewProps = {
  screen: StudioCollectionScreen;
};

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

type CollectionRow = {
  id: string;
  title: string;
  meta: string;
  studioHref: string;
  searchText: string;
};

function publicationStatusLabel(status?: string | null): string {
  return status === "draft" ? "Draft" : "Published";
}

async function fetchCollectionRows(
  screen: StudioCollectionScreen,
  signal?: AbortSignal,
): Promise<CollectionRow[]> {
  if (screen === "templates") {
    const templateDocs = await fetchPageCompositionSummaries(signal);
    return templateDocs.map((doc: PageTemplateRow) => {
      const id = String(doc.id);
      const updatedAt = formatUpdatedAt(doc.updatedAt);
      const meta = [publicationStatusLabel(doc._status), updatedAt]
        .filter(Boolean)
        .join(" · ");
      return {
        id,
        meta,
        searchText: doc.title.toLowerCase(),
        studioHref: studioHrefForComposition(id),
        title: doc.title,
      };
    });
  }

  const componentsRes = await fetch(
    `/api/${COMPONENTS_SLUG}?limit=200&depth=0&sort=-updatedAt`,
    {
      cache: "no-store",
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    },
  );
  if (!componentsRes.ok) {
    throw new Error("Studio components collection request failed");
  }
  const componentsJson = (await componentsRes.json()) as {
    docs?: ComponentRow[];
  };
  const componentDocs = Array.isArray(componentsJson.docs)
    ? componentsJson.docs
    : [];
  return componentDocs.map((doc) => {
    const id = String(doc.id);
    const updatedAt = formatUpdatedAt(doc.updatedAt);
    const meta = [doc.key, publicationStatusLabel(doc._status), updatedAt]
      .filter(Boolean)
      .join(" · ");
    return {
      id,
      meta,
      searchText: `${doc.displayName} ${doc.key ?? ""}`.toLowerCase(),
      studioHref: studioHrefForComponentDocument(id),
      title: doc.displayName,
    };
  });
}

function collectionTitle(screen: StudioCollectionScreen): string {
  return screen === "templates" ? "Page templates" : "Components";
}

function emptyStateMessage(
  screen: StudioCollectionScreen,
  hasSearch: boolean,
): string {
  if (hasSearch) {
    return screen === "templates"
      ? "No templates match your search."
      : "No components match your search.";
  }
  return screen === "templates" ? "No templates yet." : "No components yet.";
}

export default function StudioCollectionView({
  screen,
}: StudioCollectionViewProps) {
  const router = useRouter();
  const [rows, setRows] = useState<CollectionRow[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "idle" | "error">(
    "loading",
  );
  const [searchValue, setSearchValue] = useState("");

  const loadRows = useCallback(
    async (signal?: AbortSignal) => {
      setLoadState("loading");
      try {
        const nextRows = await fetchCollectionRows(screen, signal);
        if (signal?.aborted) {
          return;
        }
        setRows(nextRows);
        setLoadState("idle");
      } catch {
        if (signal?.aborted) {
          return;
        }
        setLoadState("error");
      }
    },
    [screen],
  );

  useEffect(() => {
    const ac = new AbortController();
    void loadRows(ac.signal);
    return () => {
      ac.abort();
    };
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((row) => row.searchText.includes(query));
  }, [rows, searchValue]);

  const title = collectionTitle(screen);
  const screenDescription = screen === "templates" ? "templates" : "components";
  const searchPlaceholder =
    screen === "templates" ? "Search templates..." : "Search components...";
  const newResourceLabel =
    screen === "templates" ? "New template" : "New component";

  const openNewResource = useCallback(() => {
    const kind = screen === "templates" ? "template" : "component";
    router.push(studioHrefForNewSession(kind));
  }, [router, screen]);

  const hasSearch = searchValue.trim().length > 0;
  const isLoading = loadState === "loading";
  const isError = loadState === "error";

  return (
    <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto px-4 py-4 md:px-6 md:py-5 xl:px-8">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">
            Browse and open {screenDescription} without leaving Studio.
          </p>
        </div>
        <Button onClick={openNewResource} size="sm" type="button">
          <IconPlus className="size-4" aria-hidden />
          {newResourceLabel}
        </Button>
      </header>

      {isError ? (
        <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not load {screen}. Try returning to the dashboard and reopening
          this view.
        </p>
      ) : null}

      <Card className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-card ring-0">
        <CardHeader className="gap-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {screen === "templates" ? (
                <IconLayout className="size-4" aria-hidden />
              ) : (
                <IconPuzzle className="size-4" aria-hidden />
              )}
              {title}
            </CardTitle>
            <span className="inline-flex min-w-7 items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {rows.length}
            </span>
          </div>
          <CardDescription>
            Open an existing {screen === "templates" ? "template" : "component"}{" "}
            or start a new one.
          </CardDescription>
          <div className="relative">
            <IconSearch
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              className="h-9 border-input bg-background pl-9 shadow-none"
              placeholder={searchPlaceholder}
              type="search"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-2 pr-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">
                  Loading {screen}…
                </p>
              ) : filteredRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {emptyStateMessage(screen, hasSearch)}
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5">
                  {filteredRows.map((row) => (
                    <li key={`${screen}-${row.id}`}>
                      <Item size="sm" variant="outline">
                        <ItemContent>
                          <ItemTitle className="text-sm font-semibold text-foreground md:text-base">
                            {row.title}
                          </ItemTitle>
                          <ItemDescription>{row.meta}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Button asChild size="sm">
                            <Link href={row.studioHref} prefetch={false}>
                              Open
                            </Link>
                          </Button>
                        </ItemActions>
                      </Item>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </main>
  );
}
