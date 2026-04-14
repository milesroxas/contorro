"use client";

import { useAuth, useConfig } from "@payloadcms/ui";
import { isBuilderNewComponentSessionId } from "@repo/domains-composition";
import { isBuilderComponentRowId } from "@repo/infrastructure-payload-config/builder-row-id";
import {
  BuilderApp,
  DesignSystemEditor,
  createFetchStudioAuthoringClient,
} from "@repo/presentation-studio";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import BuilderHub from "@/components/admin/BuilderHub";
import { contorroAdminUiRootProps } from "@/components/admin/contorro-admin-ui";

function BuilderViewInner() {
  const authoringClient = useMemo(
    () =>
      createFetchStudioAuthoringClient({
        compositionApiBase:
          process.env.NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE ?? "/api/builder",
        resourceApiBase:
          process.env.NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE ?? "/api",
      }),
    [],
  );

  const { user } = useAuth();
  const { config } = useConfig();
  const sp = useSearchParams();
  const compositionId = sp.get("composition") ?? "";
  const screen = sp.get("screen") ?? "";
  const adminRoute = config.routes?.admin ?? "/admin";
  const isComponentComposition =
    isBuilderComponentRowId(compositionId) ||
    isBuilderNewComponentSessionId(compositionId);

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

  const canAccessDesignSystem = role === "admin" || role === "designer";

  if (screen === "design-system") {
    return (
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <DesignSystemEditor
          authoringClient={authoringClient}
          canAccess={canAccessDesignSystem}
        />
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
          adminHref={adminRoute}
          authoringClient={authoringClient}
          canEditName={!isComponentComposition}
          compositionId={compositionId}
        />
      </div>
    </div>
  );
}

/** Payload admin custom view — architecture spec Phase 3. */
export default function BuilderView() {
  return (
    <div
      className="flex h-dvh max-h-dvh w-full min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground"
      {...contorroAdminUiRootProps}
    >
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
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
