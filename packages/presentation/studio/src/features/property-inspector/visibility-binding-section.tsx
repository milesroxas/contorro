"use client";

import {
  blockCatalogEntry,
  type CompositionNode,
  visibilityBindableFields,
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

const NOT_HIDEABLE_VALUE = "__not-hideable__";

function boundVisibilityFieldName(node: CompositionNode): string | null {
  const name = node.visibilityBinding?.editorFieldName ?? "";
  return name.trim() !== "" ? name : null;
}

/**
 * Visibility binding dropdown: lets the designer mark this element hideable by
 * content editors via one of the block's checkbox fields ("visible when truthy
 * or unset"). Independent of the Content field binding.
 */
export function VisibilityBindingSection({
  blockType,
  node,
  setNodeVisibilityBinding,
}: {
  blockType: string;
  node: CompositionNode;
  setNodeVisibilityBinding: (fieldName: string | null) => void;
}) {
  const baseId = useId();
  const entry = blockCatalogEntry(blockType);
  const bound = boundVisibilityFieldName(node);

  if (!entry) {
    return null;
  }

  const fields = visibilityBindableFields(entry);
  if (fields.length === 0 && bound === null) {
    return null;
  }

  const boundIsUnknown =
    bound !== null && !fields.some((field) => field.name === bound);

  return (
    <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/15 p-2.5">
      <div className="space-y-1">
        <Label
          className="text-xs font-medium"
          htmlFor={`${baseId}-visibility-field`}
        >
          Editor visibility
        </Label>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Editors hide this element by unticking the selected {entry.label}{" "}
          checkbox on each page.
        </p>
      </div>
      <Select
        onValueChange={(value) => {
          setNodeVisibilityBinding(value === NOT_HIDEABLE_VALUE ? null : value);
        }}
        value={bound ?? NOT_HIDEABLE_VALUE}
      >
        <SelectTrigger
          data-testid="inspector-visibility-binding"
          id={`${baseId}-visibility-field`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NOT_HIDEABLE_VALUE}>Not hideable</SelectItem>
          {fields.map((field) => (
            <SelectItem key={field.name} value={field.name}>
              {field.label}
            </SelectItem>
          ))}
          {boundIsUnknown && bound !== null ? (
            <SelectItem value={bound}>{bound} (not in catalog)</SelectItem>
          ) : null}
        </SelectContent>
      </Select>
      {boundIsUnknown ? (
        <p className="text-xs text-amber-600 dark:text-amber-500" role="alert">
          &quot;{bound}&quot; is not a checkbox field of the {entry.label} block
          type. Rebind or clear it before publishing.
        </p>
      ) : null}
    </div>
  );
}
