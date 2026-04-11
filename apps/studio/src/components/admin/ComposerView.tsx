"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { ComposerApp, PageCreateForm } from "@repo/presentation-composer-ui";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAdminURL } from "payload/shared";
import { Suspense } from "react";

import { Button } from "@/components/ui/button";

const PAGES_SLUG = "pages";

function ComposerViewInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const pageId = sp.get("page") ?? "";

  if (!pageId) {
    return (
      <PageCreateForm
        onCreated={(id) => {
          router.replace(`?page=${encodeURIComponent(id)}`);
        }}
      />
    );
  }

  return <ComposerWithRole pageId={pageId} />;
}

function ComposerWithRole({ pageId }: { pageId: string }) {
  const { user } = useAuth();
  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";
  const canPublish = role === "admin" || role === "designer";

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <ComposerPageHeader pageId={pageId} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ComposerApp canPublish={canPublish} pageId={pageId} />
      </div>
    </div>
  );
}

function ComposerPageHeader({ pageId }: { pageId: string }) {
  const { config } = useConfig();
  const adminRoute = config.routes?.admin ?? "/admin";
  const entryHref = formatAdminURL({
    adminRoute,
    path: `/collections/${PAGES_SLUG}/${encodeURIComponent(pageId)}`,
    relative: true,
  });

  return (
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
            Back to page
          </Link>
        </Button>
      </div>
    </header>
  );
}

/** Payload admin custom view — architecture spec §4.1 / Phase 4 (composer-ui). */
export default function ComposerView() {
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
          <ComposerViewInner />
        </Suspense>
      </div>
    </div>
  );
}
