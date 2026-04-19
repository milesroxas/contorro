"use client";

import { useSearchParams } from "next/navigation";
import { type ReactNode, Suspense, useMemo } from "react";

import { StudioApp } from "../app/StudioApp.js";
import { DesignSystemEditor } from "../features/design-system/DesignSystemEditor.js";
import { cn } from "../lib/cn.js";
import { createFetchStudioAuthoringClient } from "../lib/fetch-studio-authoring-client.js";
import { StudioChromeThemeHtmlSync } from "./hub/StudioChromeThemeHtmlSync.js";
import StudioCollectionView from "./StudioCollectionView.js";
import StudioDashboard from "./StudioDashboard.js";
import { StudioPrimaryNav } from "./StudioPrimaryNav.js";
import {
  resolveStudioShellScreen,
  type StudioTopLevelScreen,
  studioHrefForScreen,
  studioNavScreenForEditorComposition,
} from "./studio-navigation.js";

export type StudioShellProps = {
  userRole: string;
};

function StudioShellFrame({
  activeScreen,
  hideNavUntilDesktop = false,
  children,
}: {
  activeScreen: StudioTopLevelScreen | null;
  hideNavUntilDesktop?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
      <div
        className={cn(
          "shrink-0 border-b border-border/70 bg-muted/20 px-4 py-2 dark:bg-muted/10",
          hideNavUntilDesktop && "hidden lg:block",
        )}
      >
        <StudioPrimaryNav activeScreen={activeScreen} />
      </div>
      <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}

function StudioShellInner({ userRole }: StudioShellProps) {
  const componentsHref = studioHrefForScreen("components");
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
  const route = resolveStudioShellScreen(sp);

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
  const activeNavScreen =
    route.screen === "editor" && route.compositionId
      ? studioNavScreenForEditorComposition(route.compositionId)
      : route.screen === "editor"
        ? null
        : route.screen;

  if (route.screen === "design-system") {
    return (
      <StudioShellFrame activeScreen={activeNavScreen}>
        <DesignSystemEditor
          authoringClient={authoringClient}
          canAccess={canAccessDesignSystem}
        />
      </StudioShellFrame>
    );
  }

  if (route.screen === "templates" || route.screen === "components") {
    return (
      <StudioShellFrame activeScreen={activeNavScreen}>
        <StudioCollectionView screen={route.screen} />
      </StudioShellFrame>
    );
  }

  if (route.screen !== "editor" || !route.compositionId) {
    return (
      <StudioShellFrame activeScreen={activeNavScreen}>
        <StudioDashboard />
      </StudioShellFrame>
    );
  }

  return (
    <StudioShellFrame activeScreen={activeNavScreen} hideNavUntilDesktop>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <StudioApp
          authoringClient={authoringClient}
          canEditName
          compositionId={route.compositionId}
          componentsHref={componentsHref}
        />
      </div>
    </StudioShellFrame>
  );
}

/** Studio route shell: hub, design system screen, and composition editor. */
export function StudioShell({ userRole }: StudioShellProps) {
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
          <StudioShellInner userRole={userRole} />
        </Suspense>
      </div>
    </div>
  );
}
