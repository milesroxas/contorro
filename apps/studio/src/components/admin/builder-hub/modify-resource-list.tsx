import { builderRowIdForComponent } from "@repo/infrastructure-payload-config/builder-row-id";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";
import { formatAdminURL } from "payload/shared";
import { useMemo } from "react";

import {
  COMPONENTS_SLUG,
  PAGE_COMPOSITIONS_SLUG,
} from "@/components/admin/builder-hub/constants";
import { formatUpdatedAt } from "@/components/admin/builder-hub/formatters";
import {
  hubListRowClass,
  hubScrollAreaClass,
} from "@/components/admin/builder-hub/hub-styles";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type TemplateRow = {
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

type NormalizedListRow = {
  id: string;
  title: string;
  meta: string;
  editHref: string;
  studioHref: string;
};

function normalizeRows(
  resource: "templates" | "components",
  rows: TemplateRow[] | ComponentRow[],
  adminRoute: string,
): NormalizedListRow[] {
  if (resource === "templates") {
    return (rows as TemplateRow[]).map((doc) => {
      const id = String(doc.id);
      const parts: string[] = [];
      if (doc._status === "draft") parts.push("Draft");
      const updated = formatUpdatedAt(doc.updatedAt);
      if (updated) parts.push(updated);
      return {
        id,
        title: doc.title,
        meta: parts.join(" · "),
        editHref: formatAdminURL({
          adminRoute,
          path: `/collections/${PAGE_COMPOSITIONS_SLUG}/${encodeURIComponent(id)}`,
          relative: true,
        }),
        studioHref: formatAdminURL({
          adminRoute,
          path: `/studio?composition=${encodeURIComponent(id)}`,
          relative: true,
        }),
      };
    });
  }
  return (rows as ComponentRow[]).map((doc) => {
    const id = String(doc.id);
    const parts: string[] = [];
    if (doc.key) parts.push(doc.key);
    if (doc._status === "draft") parts.push("Draft");
    const updated = formatUpdatedAt(doc.updatedAt);
    if (updated) parts.push(updated);
    return {
      id,
      title: doc.displayName,
      meta: parts.join(" · "),
      editHref: formatAdminURL({
        adminRoute,
        path: `/collections/${COMPONENTS_SLUG}/${encodeURIComponent(id)}`,
        relative: true,
      }),
      studioHref: formatAdminURL({
        adminRoute,
        path: `/studio?composition=${encodeURIComponent(builderRowIdForComponent(id))}`,
        relative: true,
      }),
    };
  });
}

type ModifyResourceListProps = {
  adminRoute: string;
  resource: "templates" | "components";
  rows: TemplateRow[] | ComponentRow[];
  loadState: "idle" | "loading" | "error";
  emptyHref: string;
  emptyCtaLabel: string;
};

export function ModifyResourceList({
  adminRoute,
  resource,
  rows,
  loadState,
  emptyHref,
  emptyCtaLabel,
}: ModifyResourceListProps) {
  const normalized = useMemo(
    () => normalizeRows(resource, rows, adminRoute),
    [adminRoute, resource, rows],
  );

  return (
    <ScrollArea className={hubScrollAreaClass}>
      <ul className="flex flex-col">
        {normalized.length === 0 && loadState === "idle" ? (
          <li className="py-8 text-center text-sm text-muted-foreground md:py-10 md:text-base">
            Nothing matches.{" "}
            <Button
              asChild
              className="h-auto min-h-0 px-0.5 py-0 text-base font-medium underline-offset-4 md:text-lg"
              variant="link"
            >
              <Link href={emptyHref} prefetch={false}>
                {emptyCtaLabel}
              </Link>
            </Button>
          </li>
        ) : null}
        {normalized.map((row, i) => (
          <li key={row.id}>
            {i > 0 ? <Separator /> : null}
            <div className={hubListRowClass}>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-base font-medium text-foreground md:text-lg">
                  {row.title}
                </p>
                {row.meta ? (
                  <p
                    className={cn(
                      "text-xs text-muted-foreground md:text-sm",
                      resource === "components" && "truncate",
                    )}
                  >
                    {row.meta}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                <Button asChild size="default" variant="outline">
                  <Link href={row.editHref} prefetch={false}>
                    Edit
                  </Link>
                </Button>
                <Button asChild size="default" variant="secondary">
                  <Link
                    className="inline-flex items-center gap-2"
                    href={row.studioHref}
                    prefetch={false}
                  >
                    Open Studio
                    <IconArrowRight
                      className="size-4 opacity-90 motion-safe:transition-transform motion-safe:duration-200 group-hover/row:translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}
