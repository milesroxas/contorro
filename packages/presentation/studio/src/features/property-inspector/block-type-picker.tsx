"use client";

import { BLOCK_CATALOG } from "@repo/contracts-zod";
import { useId } from "react";
import { Label } from "../../components/ui/label.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";

const DESIGN_ONLY_VALUE = "__design-only__";

/** Component-level settings passed into the inspector (components only). */
export type BlockTypeSettings = {
  value: string | null;
  /** New unsaved sessions cannot persist a block type yet. */
  disabled: boolean;
  onChange: (blockType: string | null) => void;
};

/**
 * "Block type" select for a component composition — shown when the
 * composition root is selected. Options come from `BLOCK_CATALOG`; empty
 * (design-only) components are library parts without a content contract.
 */
export function BlockTypePickerSection({
  settings,
}: {
  settings: BlockTypeSettings;
}) {
  const baseId = useId();
  return (
    <div className="space-y-1.5 rounded-md border border-border/60 bg-muted/15 p-2.5">
      <div className="space-y-1">
        <Label className="text-xs font-medium" htmlFor={`${baseId}-block-type`}>
          Block type
        </Label>
        <p className="text-[11px] leading-snug text-muted-foreground">
          Content contract this design implements. Pick a type to make it
          selectable as a page block; leave design-only for library parts.
        </p>
      </div>
      <Select
        disabled={settings.disabled}
        onValueChange={(value) => {
          settings.onChange(value === DESIGN_ONLY_VALUE ? null : value);
        }}
        value={settings.value ?? DESIGN_ONLY_VALUE}
      >
        <SelectTrigger
          data-testid="inspector-block-type"
          id={`${baseId}-block-type`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={DESIGN_ONLY_VALUE}>Design-only</SelectItem>
          {BLOCK_CATALOG.map((entry) => (
            <SelectItem key={entry.slug} value={entry.slug}>
              {entry.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {settings.disabled ? (
        <p className="text-[11px] text-muted-foreground">
          Save the component draft first to set a block type.
        </p>
      ) : null}
    </div>
  );
}
