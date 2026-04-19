"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "../../components/ui/badge.js";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "../../components/ui/item.js";
import {
  fetchPageCompositionSummaries,
  type PageCompositionSummary,
} from "../../lib/fetch-page-composition-summaries.js";
import { formatUpdatedAt } from "../../shell/hub/formatters.js";
import { studioHrefForComposition } from "../../shell/studio-navigation.js";
import type { PageTemplateListFilter } from "./page-template-list-filter.js";

function isDraft(doc: PageCompositionSummary): boolean {
  return doc._status === "draft";
}

function publicationBadgeVariant(
  doc: PageCompositionSummary,
): "secondary" | "outline" {
  return isDraft(doc) ? "secondary" : "outline";
}

function publicationLabel(doc: PageCompositionSummary): string {
  return isDraft(doc) ? "Draft" : "Published";
}

function itemDescription(doc: PageCompositionSummary): string {
  const edited = formatUpdatedAt(doc.updatedAt);
  const editedPart = edited ? `Last edited ${edited}` : "";
  if (isDraft(doc)) {
    return editedPart || "Draft";
  }
  const pub = formatUpdatedAt(doc.publishedAt ?? undefined);
  if (pub) {
    return `Published ${pub}`;
  }
  return editedPart || "Published";
}

function filterByStatus(
  docs: PageCompositionSummary[],
  filter: PageTemplateListFilter,
): PageCompositionSummary[] {
  if (filter === "all") {
    return docs;
  }
  if (filter === "draft") {
    return docs.filter((d) => isDraft(d));
  }
  return docs.filter((d) => !isDraft(d));
}

function partitionByPublication(docs: PageCompositionSummary[]): {
  published: PageCompositionSummary[];
  drafts: PageCompositionSummary[];
} {
  const drafts: PageCompositionSummary[] = [];
  const published: PageCompositionSummary[] = [];
  for (const doc of docs) {
    if (isDraft(doc)) {
      drafts.push(doc);
    } else {
      published.push(doc);
    }
  }
  return { published, drafts };
}

function TemplateRow({
  doc,
  activeCompositionId,
}: {
  doc: PageCompositionSummary;
  activeCompositionId: string;
}) {
  const id = String(doc.id);
  const href = studioHrefForComposition(id);
  const isCurrent = id === activeCompositionId;

  return (
    <Item asChild size="sm" variant={isCurrent ? "muted" : "outline"}>
      <Link href={href} prefetch={false}>
        <ItemContent>
          <ItemTitle>{doc.title}</ItemTitle>
          <ItemDescription>{itemDescription(doc)}</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Badge variant={publicationBadgeVariant(doc)}>
            {publicationLabel(doc)}
          </Badge>
        </ItemActions>
      </Link>
    </Item>
  );
}

export function PageTemplatesPanel({
  activeCompositionId,
  statusFilter,
}: {
  activeCompositionId: string;
  statusFilter: PageTemplateListFilter;
}) {
  const [docs, setDocs] = useState<PageCompositionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchPageCompositionSummaries();
        if (!cancelled) {
          setDocs(list);
          setError(null);
        }
      } catch {
        if (!cancelled) {
          setDocs([]);
          setError("Could not load page templates.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () => (docs === null ? [] : filterByStatus(docs, statusFilter)),
    [docs, statusFilter],
  );

  const groupedAll = useMemo(() => {
    if (statusFilter !== "all" || docs === null) {
      return null;
    }
    return partitionByPublication(filterByStatus(docs, "all"));
  }, [docs, statusFilter]);

  if (docs === null) {
    return <p className="text-xs text-muted-foreground">Loading templates…</p>;
  }

  if (error) {
    return (
      <p className="text-xs leading-snug text-muted-foreground">{error}</p>
    );
  }

  if (filtered.length === 0) {
    return (
      <p className="text-xs leading-snug text-muted-foreground">
        {docs.length === 0
          ? "No page templates yet."
          : "No page templates match this filter."}
      </p>
    );
  }

  if (groupedAll) {
    return (
      <GroupedTemplateLists
        activeCompositionId={activeCompositionId}
        grouped={groupedAll}
      />
    );
  }

  return (
    <FlatTemplateList
      activeCompositionId={activeCompositionId}
      docs={filtered}
    />
  );
}

function GroupedTemplateLists({
  grouped,
  activeCompositionId,
}: {
  grouped: {
    published: PageCompositionSummary[];
    drafts: PageCompositionSummary[];
  };
  activeCompositionId: string;
}) {
  const sections: {
    key: string;
    label: string;
    items: PageCompositionSummary[];
  }[] = [];
  if (grouped.published.length > 0) {
    sections.push({
      items: grouped.published,
      key: "published",
      label: "Published",
    });
  }
  if (grouped.drafts.length > 0) {
    sections.push({
      items: grouped.drafts,
      key: "drafts",
      label: "Draft",
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <div className="flex flex-col gap-2" key={section.key}>
          <p className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
            {section.label}
          </p>
          <ItemGroup className="gap-1">
            {section.items.map((doc) => (
              <TemplateRow
                activeCompositionId={activeCompositionId}
                doc={doc}
                key={String(doc.id)}
              />
            ))}
          </ItemGroup>
        </div>
      ))}
    </div>
  );
}

function FlatTemplateList({
  docs,
  activeCompositionId,
}: {
  docs: PageCompositionSummary[];
  activeCompositionId: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      {docs.map((doc) => (
        <TemplateRow
          activeCompositionId={activeCompositionId}
          doc={doc}
          key={String(doc.id)}
        />
      ))}
    </div>
  );
}
