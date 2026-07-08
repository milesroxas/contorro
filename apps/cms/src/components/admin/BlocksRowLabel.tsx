"use client";

import { useRowLabel } from "@payloadcms/ui";
import { blockCatalogEntry } from "@repo/contracts-zod";

type RowData = {
  blockType?: string | null;
  heading?: unknown;
};

/** Block row title: catalog label for the block type, plus the heading value when present. */
export default function BlocksRowLabel() {
  const { data, rowNumber } = useRowLabel<RowData>();

  const slug = typeof data?.blockType === "string" ? data.blockType : "";
  const entry = slug !== "" ? blockCatalogEntry(slug) : null;
  const typeLabel =
    entry?.label ??
    (slug !== ""
      ? slug
      : `Block ${String((rowNumber ?? 0) + 1).padStart(2, "0")}`);

  const heading =
    typeof data?.heading === "string" && data.heading.trim() !== ""
      ? data.heading.trim()
      : null;

  return <span>{heading ? `${typeLabel} — ${heading}` : typeLabel}</span>;
}
