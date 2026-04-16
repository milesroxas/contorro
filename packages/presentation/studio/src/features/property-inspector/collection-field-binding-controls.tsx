"use client";

import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import {
  collectionFieldBindingSelectRows,
  findNearestCollectionAncestorNodeId,
  primitiveSupportsCollectionFieldBinding,
} from "@repo/domains-composition";
import { useEffect, useId, useMemo, useState } from "react";

import { Label } from "../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import {
  type StudioPayloadCollectionFieldMeta,
  fetchStudioPayloadCollectionFields,
} from "../../lib/studio-payload-collection-meta.js";

export function CollectionFieldBindingSection({
  composition,
  node,
  editorFieldBindingActive,
  setNodeCollectionFieldBinding,
}: {
  composition: PageComposition;
  node: CompositionNode;
  /** When the node is bound to a CMS editor field, collection binding is mutually exclusive. */
  editorFieldBindingActive: boolean;
  setNodeCollectionFieldBinding: (fieldPath: string | null) => void;
}) {
  const baseId = useId();
  const collectionAncestorId = useMemo(
    () => findNearestCollectionAncestorNodeId(composition, node.id),
    [composition, node.id],
  );
  const collectionSlug =
    collectionAncestorId &&
    typeof composition.nodes[collectionAncestorId]?.propValues
      ?.collectionSlug === "string"
      ? composition.nodes[collectionAncestorId].propValues.collectionSlug.trim()
      : "";

  const [fields, setFields] = useState<StudioPayloadCollectionFieldMeta[]>([]);
  const [fieldsError, setFieldsError] = useState<string | null>(null);
  const [fieldsResolved, setFieldsResolved] = useState(false);

  useEffect(() => {
    if (!collectionSlug) {
      setFields([]);
      setFieldsError(null);
      setFieldsResolved(false);
      return;
    }
    let cancelled = false;
    setFieldsResolved(false);
    void fetchStudioPayloadCollectionFields(collectionSlug)
      .then((list) => {
        if (!cancelled) {
          setFields(list);
          setFieldsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFieldsError("Could not load collection fields.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setFieldsResolved(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [collectionSlug]);

  const boundPath =
    node.contentBinding?.source === "collection" ? node.contentBinding.key : "";

  const { rows: fieldRows, incompatibleBinding } = useMemo(() => {
    if (!primitiveSupportsCollectionFieldBinding(node.definitionKey)) {
      return { rows: [], incompatibleBinding: false };
    }
    return collectionFieldBindingSelectRows(
      node.definitionKey,
      fields,
      boundPath,
    );
  }, [boundPath, fields, node.definitionKey]);

  if (!collectionAncestorId || !collectionSlug) {
    return null;
  }

  if (!primitiveSupportsCollectionFieldBinding(node.definitionKey)) {
    return null;
  }

  if (!fieldsResolved) {
    return null;
  }

  const disabled = editorFieldBindingActive;

  const noCompatibleFields =
    !fieldsError && fieldRows.length === 0 && !incompatibleBinding;

  if (fieldsError) {
    return (
      <div className="space-y-2 rounded-md border border-border/60 bg-muted/15 p-3">
        <div className="space-y-1">
          <Label
            className="text-sm font-medium"
            htmlFor={`${baseId}-coll-field`}
          >
            Collection field
          </Label>
          <p className="text-xs leading-snug text-muted-foreground">
            Map this element to a field from the parent Collection&apos;s CMS
            schema. Values resolve at preview and on the live site.
          </p>
        </div>
        <p className="text-xs text-destructive">{fieldsError}</p>
      </div>
    );
  }

  if (noCompatibleFields) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/15 p-3">
      <div className="space-y-1">
        <Label className="text-sm font-medium" htmlFor={`${baseId}-coll-field`}>
          Collection field
        </Label>
        <p className="text-xs leading-snug text-muted-foreground">
          Map this element to a field from the parent Collection&apos;s CMS
          schema. Values resolve at preview and on the live site.
        </p>
      </div>
      {disabled ? (
        <p className="text-xs text-muted-foreground">
          Clear &quot;Expose to CMS editors&quot; to bind collection data.
        </p>
      ) : null}
      {incompatibleBinding ? (
        <p className="text-xs text-amber-600 dark:text-amber-500">
          This field&apos;s CMS type doesn&apos;t match this element. Choose a
          compatible field or clear the mapping.
        </p>
      ) : null}
      <Select
        disabled={disabled}
        onValueChange={(value) => {
          if (value === "__none__") {
            setNodeCollectionFieldBinding(null);
            return;
          }
          setNodeCollectionFieldBinding(value);
        }}
        value={boundPath === "" ? "__none__" : boundPath}
      >
        <SelectTrigger className="h-9" id={`${baseId}-coll-field`}>
          <SelectValue placeholder="Select a field" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">Not mapped</SelectItem>
          {fieldRows.map((f) => (
            <SelectItem key={f.name} value={f.name}>
              {f.incompatible ? "(type mismatch) " : ""}
              {f.label} ({f.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
