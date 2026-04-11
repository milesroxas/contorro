"use client";

import type { PageComposition } from "@repo/contracts-zod";

import { cn } from "../../lib/cn.js";

export function TextContentField({
  composition,
  nodeId,
  onChange,
}: {
  composition: PageComposition;
  nodeId: string | null;
  onChange: (value: string) => void;
}) {
  if (!nodeId) {
    return (
      <p className="text-sm text-muted-foreground">
        No text blocks in this composition yet. Ask a designer to add a Text
        block in the builder.
      </p>
    );
  }

  const node = composition.nodes[nodeId];
  const content =
    typeof node?.propValues?.content === "string"
      ? node.propValues.content
      : "";

  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Content</span>
      <textarea
        className={cn(
          "min-h-[120px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm",
          "placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        )}
        data-testid="composer-text-content"
        onChange={(e) => onChange(e.target.value)}
        value={content}
      />
    </label>
  );
}
