"use client";

import { useConfig } from "@payloadcms/ui";
import { BuilderApp } from "@repo/presentation-builder-ui";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

const PAGE_COMPOSITIONS_SLUG = "page-compositions";

function BuilderViewInner() {
  const { config } = useConfig();
  const sp = useSearchParams();
  const compositionId = sp.get("composition") ?? "";
  const adminRoute = config.routes?.admin ?? "/admin";

  if (!compositionId) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="max-w-md text-pretty">
          Open from Page compositions: append{" "}
          <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
            ?composition=&lt;id&gt;
          </code>{" "}
          to this URL.
        </p>
      </div>
    );
  }

  const entryHref = formatAdminURL({
    adminRoute,
    path: `/collections/${PAGE_COMPOSITIONS_SLUG}/${encodeURIComponent(compositionId)}`,
    relative: true,
  });

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <header className="shrink-0 border-b border-border bg-card/40 backdrop-blur-sm">
        <div className="flex h-11 items-center px-3 sm:px-4">
          <Button
            asChild
            className="text-muted-foreground hover:text-foreground"
            size="sm"
            variant="ghost"
          >
            <Link href={entryHref} prefetch={false}>
              <IconArrowLeft
                aria-hidden
                className="size-4"
                data-icon="inline-start"
              />
              Back to page composition
            </Link>
          </Button>
        </div>
      </header>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BuilderApp compositionId={compositionId} />
      </div>
    </div>
  );
}

/** Payload admin custom view — architecture spec Phase 3. */
export default function BuilderView() {
  return (
    <div className="dark flex min-h-dvh w-full min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <Suspense
          fallback={
            <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-muted-foreground">
              Loading…
            </div>
          }
        >
          <BuilderViewInner />
        </Suspense>
      </div>
    </div>
  );
}
