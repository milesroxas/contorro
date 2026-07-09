"use client";

import {
  BLOCK_FIELD_BINDABLE_DEFINITION_KEYS,
  type BlockFieldSpec,
  blockCatalogEntry,
  type CompositionNode,
  type EditorFieldSpec,
  type PageComposition,
} from "@repo/contracts-zod";
import { useId } from "react";
import { Label } from "../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";
import { isNodeCollectionFieldMapped } from "./property-inspector-node-meta.js";

const NOT_BOUND_VALUE = "__not-bound__";

/** Catalog fields of `entry` this node kind may bind (per definitionKey). */
function compatibleCatalogFields(
  entry: NonNullable<ReturnType<typeof blockCatalogEntry>>,
  definitionKey: string,
): BlockFieldSpec[] {
  return entry.fields.filter((field) =>
    BLOCK_FIELD_BINDABLE_DEFINITION_KEYS[field.type].includes(definitionKey),
  );
}

function boundEditorFieldName(node: CompositionNode): string | null {
  const cb = node.contentBinding;
  if (cb?.source !== "editor") {
    return null;
  }
  const name = cb.editorField?.name ?? cb.key;
  return name.trim() !== "" ? name : null;
}

/** First other node already bound to `name`, if any (server re-enforces at publish). */
function otherNodeBoundToField(
  composition: PageComposition,
  nodeId: string,
  name: string,
): CompositionNode | null {
  for (const other of Object.values(composition.nodes)) {
    if (other.id !== nodeId && boundEditorFieldName(other) === name) {
      return other;
    }
  }
  return null;
}

/**
 * Catalog binding dropdown: binds this node to one of the component's block
 * type content fields (type-compatible ones only). Shown only for component
 * compositions that declare a block type.
 */
export function BlockFieldBindingSection({
  blockType,
  composition,
  node,
  setNodeEditorFieldBinding,
}: {
  blockType: string;
  composition: PageComposition;
  node: CompositionNode;
  setNodeEditorFieldBinding: (field: EditorFieldSpec | null) => void;
}) {
  const baseId = useId();
  const entry = blockCatalogEntry(blockType);
  const bound = boundEditorFieldName(node);

  if (!entry || isNodeCollectionFieldMapped(node)) {
    return null;
  }

  const fields = compatibleCatalogFields(entry, node.definitionKey);
  if (fields.length === 0 && bound === null) {
    return null;
  }

  const boundIsUnknown =
    bound !== null && !fields.some((field) => field.name === bound);
  const duplicate =
    bound !== null ? otherNodeBoundToField(composition, node.id, bound) : null;

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/15 p-3">
      <div className="space-y-1">
        <Label
          className="text-sm font-medium"
          htmlFor={`${baseId}-block-field`}
        >
          Content field
        </Label>
        <p className="text-xs leading-snug text-muted-foreground">
          Editors fill this {entry.label} field on each page; its value replaces
          this element&apos;s content.
        </p>
      </div>
      <Select
        onValueChange={(value) => {
          if (value === NOT_BOUND_VALUE) {
            setNodeEditorFieldBinding(null);
            return;
          }
          setNodeEditorFieldBinding({ name: value });
        }}
        value={bound ?? NOT_BOUND_VALUE}
      >
        <SelectTrigger
          data-testid="inspector-block-field-binding"
          id={`${baseId}-block-field`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOT_BOUND_VALUE}>Not bound</SelectItem>
          {fields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label}
              {field.required ? " (required)" : ""}
            </SelectItem>
          ))}
          {boundIsUnknown && bound !== null ? (
            <SelectItem value={bound}>{bound} (not in catalog)</SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      {duplicate !== null ? (
        <p className="text-xs text-amber-600 dark:text-amber-500" role="alert">
          &quot;{bound}&quot; is already bound on another element. Each field
          can be bound once — publishing will fail until one binding is cleared.
        </p>
      ) : null}
      {boundIsUnknown ? (
        <p className="text-xs text-amber-600 dark:text-amber-500" role="alert">
          &quot;{bound}&quot; is not a field of the {entry.label} block type.
          Rebind or clear it before publishing.
        </p>
      ) : null}
    </div>
  );
}
