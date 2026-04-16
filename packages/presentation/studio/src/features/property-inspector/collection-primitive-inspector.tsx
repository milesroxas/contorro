"use client";

import type { CompositionNode } from "@repo/contracts-zod";
import { useEffect, useId, useMemo, useState } from "react";

import { ScrollArea } from "../../components/scroll-area.js";
import { Button } from "../../components/ui/button.js";
import { Checkbox } from "../../components/ui/checkbox.js";
import { Input } from "../../components/ui/input.js";
import { Label } from "../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { Switch } from "../../components/ui/switch.js";
import { fetchPayloadCollectionDocs } from "../../lib/fetch-payload-collection-docs.js";
import {
  fetchStudioPayloadCollectionFields,
  fetchStudioPayloadCollections,
  type StudioPayloadCollectionFieldMeta,
  type StudioPayloadCollectionMeta,
} from "../../lib/studio-payload-collection-meta.js";
import { SettingsFieldRow } from "./property-control-label.js";

type CollectionFilterRow = {
  rowId: string;
  field: string;
  fieldKind: string;
  op: string;
  value: string;
};

function normalizeFilters(raw: unknown): CollectionFilterRow[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: CollectionFilterRow[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const r = row as Record<string, unknown>;
    out.push({
      rowId: typeof r.rowId === "string" ? r.rowId : "",
      field: typeof r.field === "string" ? r.field : "",
      fieldKind: typeof r.fieldKind === "string" ? r.fieldKind : "text",
      op: typeof r.op === "string" ? r.op : "equals",
      value: typeof r.value === "string" ? r.value : "",
    });
  }
  return out;
}

function normalizeManualIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((id) =>
      typeof id === "string" || typeof id === "number" ? String(id) : "",
    )
    .filter((id) => id.length > 0);
}

function operatorsForKind(kind: string): readonly string[] {
  if (kind === "number") {
    return ["equals", "not_equals", "greater_than", "less_than"];
  }
  if (kind === "date") {
    return ["equals", "greater_than", "less_than"];
  }
  if (kind === "checkbox" || kind === "select" || kind === "upload") {
    return ["equals", "not_equals"];
  }
  return ["equals", "not_equals", "contains"];
}

function CollectionFilterRowEditor({
  baseId,
  fieldMeta,
  filter,
  onChange,
  onRemove,
}: {
  baseId: string;
  fieldMeta: StudioPayloadCollectionFieldMeta[];
  filter: CollectionFilterRow;
  onChange: (next: CollectionFilterRow) => void;
  onRemove: () => void;
}) {
  const ops = operatorsForKind(filter.fieldKind);
  const kindForField = (fieldName: string): string => {
    const found = fieldMeta.find((f) => f.name === fieldName);
    return found?.kind ?? "text";
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Field</Label>
          <Select
            onValueChange={(v) => {
              const k = kindForField(v);
              const nextOps = operatorsForKind(k);
              onChange({
                ...filter,
                field: v,
                fieldKind: k,
                op: nextOps.includes(filter.op)
                  ? filter.op
                  : (nextOps[0] ?? "equals"),
              });
            }}
            value={filter.field || undefined}
          >
            <SelectTrigger className="h-8" id={`${baseId}-field`}>
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent>
              {fieldMeta.map((f) => (
                <SelectItem key={f.name} value={f.name}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Operator</Label>
          <Select
            onValueChange={(v) => onChange({ ...filter, op: v })}
            value={filter.op || undefined}
          >
            <SelectTrigger className="h-8" id={`${baseId}-op`}>
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              {ops.map((op) => (
                <SelectItem key={op} value={op}>
                  {op}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label
          className="text-xs text-muted-foreground"
          htmlFor={`${baseId}-val`}
        >
          Value
        </Label>
        {filter.fieldKind === "checkbox" ? (
          <Select
            onValueChange={(v) => onChange({ ...filter, value: v })}
            value={filter.value || "true"}
          >
            <SelectTrigger className="h-8" id={`${baseId}-val`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Input
            className="h-8"
            id={`${baseId}-val`}
            onChange={(e) => onChange({ ...filter, value: e.target.value })}
            type={filter.fieldKind === "number" ? "number" : "text"}
            value={filter.value}
          />
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={onRemove} size="sm" type="button" variant="ghost">
          Remove filter
        </Button>
      </div>
    </div>
  );
}

function CollectionInspectorDynamicListSection({
  baseId,
  collectionSlug,
  fields,
  fieldsError,
  filters,
  filtersReady,
  node,
  patchNodeProps,
  resetNodePropKey,
  addFilter,
  updateFilterAt,
  removeFilterAt,
}: {
  baseId: string;
  collectionSlug: string;
  fields: StudioPayloadCollectionFieldMeta[];
  fieldsError: string | null;
  filters: CollectionFilterRow[];
  filtersReady: boolean;
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
  addFilter: () => void;
  updateFilterAt: (index: number, next: CollectionFilterRow) => void;
  removeFilterAt: (index: number) => void;
}) {
  const collectionSort =
    typeof node.propValues?.collectionSort === "string"
      ? node.propValues.collectionSort
      : "-updatedAt";

  return (
    <>
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-sort`}
        label="Sort"
        onResetProp={resetNodePropKey}
        propKey="collectionSort"
        propValues={node.propValues}
      >
        <Input
          className="h-8"
          id={`${baseId}-sort`}
          onChange={(e) => patchNodeProps({ collectionSort: e.target.value })}
          placeholder="-updatedAt"
          value={collectionSort}
        />
      </SettingsFieldRow>
      {fieldsError ? (
        <p className="text-sm text-destructive">{fieldsError}</p>
      ) : null}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Filters</Label>
          <Button
            disabled={!collectionSlug.trim() || fields.length === 0}
            onClick={addFilter}
            size="sm"
            type="button"
            variant="outline"
          >
            Add filter
          </Button>
        </div>
        {filters.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No filters — all published documents (subject to access) are
            considered.
          </p>
        ) : null}
        {!filtersReady ? (
          <p className="text-xs text-muted-foreground">Preparing filters…</p>
        ) : (
          filters.map((f, i) => (
            <CollectionFilterRowEditor
              baseId={`${baseId}-f-${f.rowId}`}
              fieldMeta={fields}
              filter={f}
              key={f.rowId}
              onChange={(next) => updateFilterAt(i, next)}
              onRemove={() => removeFilterAt(i)}
            />
          ))
        )}
      </div>
    </>
  );
}

function CollectionInspectorManualEntriesSection({
  baseId,
  collectionSlug,
  manualDocs,
  manualDocsError,
  manualEntryIds,
  toggleManualId,
}: {
  baseId: string;
  collectionSlug: string;
  manualDocs: Awaited<ReturnType<typeof fetchPayloadCollectionDocs>> | null;
  manualDocsError: string | null;
  manualEntryIds: string[];
  toggleManualId: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">Entries</Label>
      {manualDocsError ? (
        <p className="text-sm text-destructive">{manualDocsError}</p>
      ) : null}
      {!collectionSlug.trim() ? (
        <p className="text-xs text-muted-foreground">
          Choose a collection first.
        </p>
      ) : manualDocs === null ? (
        <p className="text-xs text-muted-foreground">Loading…</p>
      ) : manualDocs.length === 0 ? (
        <p className="text-xs text-muted-foreground">No entries found.</p>
      ) : (
        <ScrollArea className="max-h-48 rounded-md border border-border/60">
          <div className="space-y-2 p-2">
            {manualDocs.map((doc) => {
              const checked = manualEntryIds.includes(doc.id);
              const checkboxId = `${baseId}-manual-${doc.id}`;
              return (
                <label
                  className="flex cursor-pointer items-start gap-2 rounded-sm px-1 py-0.5 hover:bg-accent/40"
                  htmlFor={checkboxId}
                  key={doc.id}
                >
                  <Checkbox
                    checked={checked}
                    id={checkboxId}
                    onChange={(e) => toggleManualId(doc.id, e.target.checked)}
                  />
                  <span className="text-sm leading-tight">
                    <span className="font-medium">{doc.label}</span>
                    {doc.slug ? (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({doc.slug})
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

export function CollectionPrimitiveInspector({
  node,
  patchNodeProps,
  resetNodePropKey,
}: {
  node: CompositionNode;
  patchNodeProps: (patch: Record<string, unknown>) => void;
  resetNodePropKey: (propKey: string) => void;
}) {
  const baseId = useId();
  const collectionSlug =
    typeof node.propValues?.collectionSlug === "string"
      ? node.propValues.collectionSlug
      : "";
  const dynamicList = Boolean(node.propValues?.dynamicList);
  const filters = useMemo(
    () => normalizeFilters(node.propValues?.collectionFilters),
    [node.propValues?.collectionFilters],
  );
  const filtersReady = filters.every((f) => f.rowId.trim().length > 0);
  const manualEntryIds = useMemo(
    () => normalizeManualIds(node.propValues?.manualEntryIds),
    [node.propValues?.manualEntryIds],
  );

  const [collections, setCollections] = useState<StudioPayloadCollectionMeta[]>(
    [],
  );
  const [collectionsError, setCollectionsError] = useState<string | null>(null);
  const [fields, setFields] = useState<StudioPayloadCollectionFieldMeta[]>([]);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [manualDocs, setManualDocs] = useState<Awaited<
    ReturnType<typeof fetchPayloadCollectionDocs>
  > | null>(null);
  const [manualDocsError, setManualDocsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchStudioPayloadCollections()
      .then((list) => {
        if (!cancelled) {
          setCollections(list);
          setCollectionsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCollectionsError("Could not load collections.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const slug = collectionSlug.trim();
    if (!slug) {
      setFields([]);
      return;
    }
    let cancelled = false;
    void fetchStudioPayloadCollectionFields(slug)
      .then((list) => {
        if (!cancelled) {
          setFields(list);
          setFieldsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFieldsError("Could not load fields.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [collectionSlug]);

  useEffect(() => {
    const slug = collectionSlug.trim();
    if (!slug || dynamicList) {
      setManualDocs(null);
      return;
    }
    let cancelled = false;
    void fetchPayloadCollectionDocs(slug)
      .then((docs) => {
        if (!cancelled) {
          setManualDocs(docs);
          setManualDocsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setManualDocsError("Could not load entries.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [collectionSlug, dynamicList]);

  useEffect(() => {
    if (filtersReady) {
      return;
    }
    patchNodeProps({
      collectionFilters: filters.map((f) =>
        f.rowId.trim().length > 0 ? f : { ...f, rowId: crypto.randomUUID() },
      ),
    });
  }, [filters, filtersReady, patchNodeProps]);

  function toggleManualId(id: string, checked: boolean) {
    const set = new Set(manualEntryIds);
    if (checked) {
      set.add(id);
    } else {
      set.delete(id);
    }
    patchNodeProps({ manualEntryIds: [...set] });
  }

  function updateFilterAt(index: number, next: CollectionFilterRow) {
    const copy = [...filters];
    copy[index] = next;
    patchNodeProps({ collectionFilters: copy });
  }

  function removeFilterAt(index: number) {
    patchNodeProps({
      collectionFilters: filters.filter((_, i) => i !== index),
    });
  }

  function addFilter() {
    patchNodeProps({
      collectionFilters: [
        ...filters,
        {
          rowId: crypto.randomUUID(),
          field: "",
          fieldKind: "text",
          op: "equals",
          value: "",
        },
      ],
    });
  }

  return (
    <div className="space-y-4 border-t border-border/60 pt-4">
      <SettingsFieldRow
        definitionKey={node.definitionKey}
        htmlFor={`${baseId}-coll`}
        label="Collection"
        onResetProp={resetNodePropKey}
        propKey="collectionSlug"
        propValues={node.propValues}
      >
        {collectionsError ? (
          <p className="text-sm text-destructive" role="alert">
            {collectionsError}
          </p>
        ) : (
          <Select
            onValueChange={(v) => patchNodeProps({ collectionSlug: v })}
            value={collectionSlug.trim() || undefined}
          >
            <SelectTrigger className="h-8" id={`${baseId}-coll`}>
              <SelectValue placeholder="Choose collection" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((c) => (
                <SelectItem key={c.slug} value={c.slug}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </SettingsFieldRow>

      <div className="flex items-center justify-between gap-3 rounded-md border border-border/60 px-3 py-2">
        <div className="space-y-0.5">
          <Label className="text-sm" htmlFor={`${baseId}-dyn`}>
            Dynamic list
          </Label>
          <p className="text-xs text-muted-foreground">
            Off: pick entries. On: query with filters + sort.
          </p>
        </div>
        <Switch
          checked={dynamicList}
          id={`${baseId}-dyn`}
          onCheckedChange={(checked) =>
            patchNodeProps({ dynamicList: checked })
          }
        />
      </div>

      {dynamicList ? (
        <CollectionInspectorDynamicListSection
          addFilter={addFilter}
          baseId={baseId}
          collectionSlug={collectionSlug}
          fields={fields}
          fieldsError={fieldsError}
          filters={filters}
          filtersReady={filtersReady}
          node={node}
          patchNodeProps={patchNodeProps}
          removeFilterAt={removeFilterAt}
          resetNodePropKey={resetNodePropKey}
          updateFilterAt={updateFilterAt}
        />
      ) : (
        <CollectionInspectorManualEntriesSection
          baseId={baseId}
          collectionSlug={collectionSlug}
          manualDocs={manualDocs}
          manualDocsError={manualDocsError}
          manualEntryIds={manualEntryIds}
          toggleManualId={toggleManualId}
        />
      )}
    </div>
  );
}
