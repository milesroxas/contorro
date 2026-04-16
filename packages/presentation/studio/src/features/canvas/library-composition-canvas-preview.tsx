"use client";

import type { TokenMeta } from "@repo/config-tailwind";
import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import {
  defaultPrimitiveRegistry,
  LibraryComponent,
} from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import type { CSSProperties, ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "../../lib/cn.js";

function LibraryCompositionPreviewSkeleton({
  className,
  style,
}: {
  className: string;
  style?: CSSProperties;
}) {
  const bar =
    "rounded-md bg-muted-foreground/[0.12] motion-reduce:animate-none motion-safe:animate-pulse dark:bg-muted-foreground/[0.14]";

  return (
    <output
      aria-busy="true"
      className={cn(
        "relative block min-h-[5rem] w-full overflow-hidden rounded-md border border-dashed border-border/70 bg-gradient-to-br from-muted/35 via-background/90 to-muted/25 p-3 shadow-[inset_0_1px_0_0_hsl(var(--foreground)/0.04)] dark:border-border/55 dark:from-muted/20 dark:via-card/50 dark:to-muted/15",
        className,
      )}
      style={style}
    >
      <span className="sr-only">Loading library component preview</span>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.45] dark:opacity-[0.35]"
        style={{
          backgroundImage: `linear-gradient(
            125deg,
            transparent 0%,
            transparent 40%,
            hsl(var(--primary) / 0.07) 50%,
            transparent 60%,
            transparent 100%
          )`,
          backgroundSize: "200% 200%",
        }}
      />
      <div className="relative flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              bar,
              "h-1.5 w-10 rounded-full bg-primary/25 dark:bg-primary/30",
            )}
          />
          <div className={cn(bar, "h-1.5 flex-1 max-w-[40%]")} />
        </div>
        <div className={cn(bar, "h-9 w-full [animation-delay:120ms]")} />
        <div className="flex gap-2">
          <div className={cn(bar, "h-6 flex-1 [animation-delay:240ms]")} />
          <div className={cn(bar, "h-6 w-[32%] [animation-delay:360ms]")} />
        </div>
        <div className="flex gap-2 pt-0.5">
          <div className={cn(bar, "h-4 flex-[1.2] [animation-delay:200ms]")} />
          <div className={cn(bar, "h-4 flex-1 [animation-delay:320ms]")} />
          <div className={cn(bar, "h-4 w-[18%] [animation-delay:440ms]")} />
        </div>
      </div>
    </output>
  );
}

function parsePreviewResponse(raw: unknown): PageComposition | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const comp = (raw as { data?: { composition?: unknown } }).data?.composition;
  const parsed = PageCompositionSchema.safeParse(comp);
  return parsed.success ? parsed.data : null;
}

async function fetchExpandedLibraryComposition(
  componentKey: string,
): Promise<PageComposition | null> {
  try {
    const res = await fetch(
      `/api/studio/library-components/preview?key=${encodeURIComponent(componentKey)}`,
      { credentials: "include" },
    );
    if (!res.ok) {
      return null;
    }
    const json: unknown = await res.json();
    return parsePreviewResponse(json);
  } catch {
    return null;
  }
}

export function LibraryCompositionCanvasPreview({
  node,
  className,
  style,
  tokenMeta,
}: {
  node: CompositionNode;
  className: string;
  style?: CSSProperties;
  tokenMeta: TokenMeta[];
}): ReactElement {
  const componentKey =
    typeof node.propValues?.componentKey === "string"
      ? node.propValues.componentKey.trim()
      : "";

  const [expanded, setExpanded] = useState<PageComposition | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );

  useEffect(() => {
    if (!componentKey) {
      setExpanded(null);
      setPhase("fallback");
      return;
    }

    let cancelled = false;
    setPhase("loading");
    setExpanded(null);

    void (async () => {
      const composition = await fetchExpandedLibraryComposition(componentKey);
      if (cancelled) {
        return;
      }
      if (!composition) {
        setPhase("fallback");
        return;
      }
      setExpanded(composition);
      setPhase("ready");
    })();

    return () => {
      cancelled = true;
    };
  }, [componentKey]);

  const expandedTree = useMemo(() => {
    if (phase !== "ready" || !expanded) {
      return null;
    }
    try {
      return renderComposition(expanded, defaultPrimitiveRegistry, tokenMeta);
    } catch {
      return null;
    }
  }, [expanded, phase, tokenMeta]);

  if (phase === "loading") {
    return (
      <LibraryCompositionPreviewSkeleton className={className} style={style} />
    );
  }

  if (phase === "fallback" || !expanded || expandedTree === null) {
    return <LibraryComponent className={className} node={node} style={style} />;
  }

  return (
    <div
      className={cn("pointer-events-none w-full min-w-0", className)}
      style={style}
    >
      {expandedTree}
    </div>
  );
}
