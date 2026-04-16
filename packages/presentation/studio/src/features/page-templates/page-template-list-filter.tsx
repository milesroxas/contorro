"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select.js";

export type PageTemplateListFilter = "all" | "draft" | "published";

export function PageTemplateListFilterSelect({
  value,
  onValueChange,
}: {
  value: PageTemplateListFilter;
  onValueChange: (next: PageTemplateListFilter) => void;
}) {
  return (
    <Select
      onValueChange={(v) => {
        if (v === "all" || v === "draft" || v === "published") {
          onValueChange(v);
        }
      }}
      value={value}
    >
      <SelectTrigger
        aria-label="Filter page templates"
        className="h-8 w-full border-border/80 bg-background/80 text-left text-xs normal-case"
      >
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem className="text-xs" value="all">
          All
        </SelectItem>
        <SelectItem className="text-xs" value="draft">
          Draft
        </SelectItem>
        <SelectItem className="text-xs" value="published">
          Publish
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
