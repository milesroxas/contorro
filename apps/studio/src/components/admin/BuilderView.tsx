"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { isBuilderComponentRowId } from "@repo/infrastructure-payload-config/builder-row-id";
import { BuilderApp } from "@repo/presentation-builder-ui";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import BuilderHub from "@/components/admin/BuilderHub";

function BuilderViewInner() {
  const { user } = useAuth();
  const { config } = useConfig();
  const sp = useSearchParams();
  const compositionId = sp.get("composition") ?? "";
  const adminRoute = config.routes?.admin ?? "/admin";
  const isComponentComposition = isBuilderComponentRowId(compositionId);

  const role =
    user && typeof user === "object" && "role" in user
      ? String((user as { role?: unknown }).role)
      : "";

  if (role === "contentEditor") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="max-w-md text-pretty">
          The visual builder is limited to admin and designer roles. Use{" "}
          <strong className="text-foreground">Composer</strong> to edit page
          content.
        </p>
      </div>
    );
  }

  if (!compositionId) {
    return <BuilderHub />;
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <BuilderApp
          canEditName={!isComponentComposition}
          compositionId={compositionId}
          studioHref={adminRoute}
        />
      </div>
    </div>
  );
}

/** Payload admin custom view — architecture spec Phase 3. */
export default function BuilderView() {
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
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
