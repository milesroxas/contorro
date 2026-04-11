"use client";

import type { CompositionNode, PageComposition } from "@repo/contracts-zod";

import { cn } from "../../lib/cn.js";

function readBackgroundToken(
  composition: PageComposition,
  node: CompositionNode,
): string {
  if (!node.styleBindingId) {
    return "";
  }
  const sb = composition.styleBindings[node.styleBindingId];
  if (!sb) {
    return "";
  }
  const t = sb.properties.find(
    (p) => p.type === "token" && p.property === "background",
  );
  return t?.type === "token" ? t.token : "";
}

export function PropertyInspector({
  composition,
  node,
  onTextChange,
  onBackgroundToken,
}: {
  composition: PageComposition | null;
  node: CompositionNode | null;
  onTextChange: (content: string) => void;
  onBackgroundToken: (token: string) => void;
}) {
  if (!node || !composition) {
    return (
      <div className="text-sm text-muted-foreground">
        Select an element on the canvas or in layers.
      </div>
    );
  }

  const isText = node.definitionKey === "primitive.text";
  const isBox = node.definitionKey === "primitive.box";

  const content =
    typeof node.propValues?.content === "string" ? node.propValues.content : "";
  const bgToken = readBackgroundToken(composition, node);

  return (
    <div className="space-y-4 text-sm">
      <div className="font-mono text-xs text-muted-foreground">
        {node.definitionKey}
      </div>
      {isText ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-foreground">Content</span>
          <input
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            data-testid="inspector-text-content"
            onChange={(e) => onTextChange(e.target.value)}
            type="text"
            value={content}
          />
        </label>
      ) : null}
      {isBox ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-foreground">
            Background token
          </span>
          <input
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
            data-testid="inspector-box-background-token"
            onChange={(e) => onBackgroundToken(e.target.value)}
            placeholder="color.surface.primary"
            type="text"
            value={bgToken}
          />
        </label>
      ) : null}
    </div>
  );
}
