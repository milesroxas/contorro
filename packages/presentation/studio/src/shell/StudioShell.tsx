"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { StudioApp } from "../app/StudioApp.js";
import { DesignSystemEditor } from "../features/design-system/DesignSystemEditor.js";
import { createFetchStudioAuthoringClient } from "../lib/fetch-studio-authoring-client.js";
import StudioDashboard from "./StudioDashboard.js";
import { StudioChromeThemeHtmlSync } from "./hub/StudioChromeThemeHtmlSync.js";
import { COMPONENTS_SLUG } from "./hub/constants.js";
import { adminCollectionsIndexHref } from "./lib/admin-hrefs.js";

export type StudioShellProps = {
  adminRoute: string;
  userRole: string;
};

function StudioShellInner({ adminRoute, userRole }: StudioShellProps) {
  const studioDashboardHref = "/studio";
  const componentsHref = adminCollectionsIndexHref(adminRoute, COMPONENTS_SLUG);
  const designSystemHref = "/studio?screen=design-system";
  const authoringClient = useMemo(
    () =>
      createFetchStudioAuthoringClient({
        compositionApiBase:
          process.env.NEXT_PUBLIC_STUDIO_COMPOSITION_API_BASE ?? "/api/studio",
        resourceApiBase:
          process.env.NEXT_PUBLIC_STUDIO_RESOURCE_API_BASE ?? "/api",
      }),
    [],
  );

  const sp = useSearchParams();
  const compositionId = sp.get("composition") ?? "";
  const screen = sp.get("screen") ?? "";

  if (userRole === "contentEditor") {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="max-w-md text-pretty">
          Studio is limited to admin and designer roles. Use{" "}
          <strong className="text-foreground">Composer</strong> to edit page
          content.
        </p>
      </div>
    );
  }

  const canAccessDesignSystem = userRole === "admin" || userRole === "designer";

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
    return <StudioDashboard adminRoute={adminRoute} />;
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <StudioApp
          adminHref={adminRoute}
          authoringClient={authoringClient}
          canEditName
          compositionId={compositionId}
          componentsHref={componentsHref}
          dashboardHref={studioDashboardHref}
          designSystemHref={designSystemHref}
        />
      </div>
    </div>
  );
}

/** Studio route shell: hub, design system screen, and composition editor. */
export function StudioShell({ adminRoute, userRole }: StudioShellProps) {
  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-1 flex-col overflow-y-auto bg-background text-foreground lg:h-dvh lg:max-h-dvh lg:overflow-hidden">
      <StudioChromeThemeHtmlSync />
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:overflow-hidden">
        <Suspense
          fallback={
            <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-muted-foreground">
              Loading…
            </div>
          }
        >
          <StudioShellInner adminRoute={adminRoute} userRole={userRole} />
        </Suspense>
      </div>
    </div>
  );
}
