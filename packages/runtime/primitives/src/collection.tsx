"use client";

import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";
import {
  Children,
  type ReactNode,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";

import { CollectionItemDocProvider } from "./collection-item-context.js";
import { buildPayloadCollectionFindUrl } from "./payload-rest-query.js";
import { PrimitiveEmptyState } from "./primitive-empty-state.js";

/** Default list semantics: unstyled list; author `className` can add layout (e.g. flex, gap) and `[&>li]:…` for items. */
const COLLECTION_ROOT_CLASS = "list-none min-w-0";

type DocRow = Record<string, unknown> & { id?: unknown };

function mergeCollectionRootClassName(className: string | undefined): string {
  return [COLLECTION_ROOT_CLASS, className].filter(Boolean).join(" ");
}

function cloneTemplateForKey(
  template: ReactNode,
  keyPrefix: string,
): ReactNode {
  return Children.map(template, (child, i) => {
    if (!isValidElement(child)) {
      return child;
    }
    const k = child.key != null ? String(child.key) : String(i);
    return cloneElement(child, { key: `${keyPrefix}-${k}` });
  });
}

function normalizeIdList(raw: unknown): (string | number)[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: (string | number)[] = [];
  for (const id of raw) {
    if (typeof id === "number" && Number.isFinite(id)) {
      out.push(id);
    } else if (typeof id === "string" && id.trim() !== "") {
      const n = Number.parseInt(id, 10);
      out.push(Number.isNaN(n) ? id.trim() : n);
    }
  }
  return out;
}

function clauseFromCollectionFilterRow(
  row: unknown,
): Record<string, unknown> | undefined {
  if (!row || typeof row !== "object") {
    return undefined;
  }
  const r = row as Record<string, unknown>;
  const field = typeof r.field === "string" ? r.field.trim() : "";
  const op = typeof r.op === "string" ? r.op.trim() : "";
  const rawVal = typeof r.value === "string" ? r.value : "";
  const kind = typeof r.fieldKind === "string" ? r.fieldKind : "text";
  if (!field || !op) {
    return undefined;
  }
  return clauseForFilter(field, op, rawVal, kind);
}

function filterClausesFromCollectionFilters(
  rows: unknown,
): Record<string, unknown>[] {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }
  const parts: Record<string, unknown>[] = [];
  for (const row of rows) {
    const clause = clauseFromCollectionFilterRow(row);
    if (clause) {
      parts.push(clause);
    }
  }
  return parts;
}

function compileWhereFromNode(
  node: RuntimePrimitiveProps["node"],
): Record<string, unknown> | undefined {
  const dynamic = Boolean(node.propValues?.dynamicList);
  if (!dynamic) {
    const ids = normalizeIdList(node.propValues?.manualEntryIds);
    if (ids.length === 0) {
      return undefined;
    }
    return { id: { in: ids } };
  }
  const parts = filterClausesFromCollectionFilters(
    node.propValues?.collectionFilters,
  );
  if (parts.length === 0) {
    return undefined;
  }
  if (parts.length === 1) {
    return parts[0];
  }
  return { and: parts };
}

function clauseForFilter(
  field: string,
  op: string,
  raw: string,
  kind: string,
): Record<string, unknown> | undefined {
  if (raw.trim() === "") {
    return undefined;
  }
  let coerced: string | number | boolean = raw;
  if (kind === "number") {
    const n = Number(raw);
    if (Number.isNaN(n)) {
      return undefined;
    }
    coerced = n;
  } else if (kind === "checkbox") {
    coerced = raw === "true" || raw === "1";
  }
  return { [field]: { [op]: coerced } };
}

/** CMS collection list: repeats `collectionTemplate` once per matching document. */
export function Collection({
  node,
  className,
  style,
  collectionTemplate,
}: RuntimePrimitiveProps) {
  const [docs, setDocs] = useState<DocRow[] | "error" | "loading">("loading");

  useEffect(() => {
    const pv = node.propValues ?? {};
    const slug =
      typeof pv.collectionSlug === "string"
        ? pv.collectionSlug.trim().replace(/^\/+|\/+$/g, "")
        : "";
    if (!slug) {
      setDocs([]);
      return;
    }
    const sort =
      typeof pv.collectionSort === "string" && pv.collectionSort.trim() !== ""
        ? pv.collectionSort.trim()
        : "-updatedAt";
    const where = compileWhereFromNode(node);
    const url = buildPayloadCollectionFindUrl(slug, {
      depth: 1,
      limit: 50,
      sort,
      where,
    });
    let cancelled = false;
    setDocs("loading");
    void fetch(url, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(String(res.status));
        }
        return res.json() as Promise<{ docs?: unknown[] }>;
      })
      .then((json) => {
        if (cancelled) {
          return;
        }
        const list = Array.isArray(json.docs) ? json.docs : [];
        setDocs(list as unknown as DocRow[]);
      })
      .catch(() => {
        if (!cancelled) {
          setDocs("error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [node]);

  const slug =
    typeof node.propValues?.collectionSlug === "string"
      ? node.propValues.collectionSlug.trim()
      : "";
  const templateCount = Children.count(collectionTemplate);

  if (!slug) {
    return (
      <PrimitiveEmptyState
        className={mergeCollectionRootClassName(className)}
        style={style}
        variant="panel"
      >
        Select a collection in the inspector.
      </PrimitiveEmptyState>
    );
  }

  if (templateCount === 0) {
    return (
      <PrimitiveEmptyState
        className={mergeCollectionRootClassName(className)}
        style={style}
        variant="panel"
      >
        Add children to define the repeated item layout.
      </PrimitiveEmptyState>
    );
  }

  if (docs === "loading") {
    return (
      <div className={mergeCollectionRootClassName(className)} style={style}>
        <span className="text-sm text-muted-foreground">Loading…</span>
      </div>
    );
  }

  if (docs === "error") {
    return (
      <PrimitiveEmptyState
        className={mergeCollectionRootClassName(className)}
        style={style}
        variant="panel"
      >
        Could not load collection entries.
      </PrimitiveEmptyState>
    );
  }

  if (docs.length === 0) {
    return (
      <PrimitiveEmptyState
        className={mergeCollectionRootClassName(className)}
        style={style}
        variant="panel"
      >
        No entries match this collection query.
      </PrimitiveEmptyState>
    );
  }

  return (
    <ul
      className={mergeCollectionRootClassName(className)}
      data-contorro-collection=""
      style={style}
    >
      {docs.map((doc, index) => {
        const id =
          doc.id !== undefined && doc.id !== null
            ? String(doc.id)
            : `idx-${index}`;
        const row = doc as Record<string, unknown>;
        return (
          <li data-contorro-collection-item="" key={id}>
            <CollectionItemDocProvider doc={row}>
              {cloneTemplateForKey(collectionTemplate, id)}
            </CollectionItemDocProvider>
          </li>
        );
      })}
    </ul>
  );
}
