import {
  isStudioComponentRowId,
  parseStudioNewCompositionSessionId,
  studioNewCompositionSessionId,
  studioRowIdForComponent,
} from "@repo/domains-composition";
import {
  IconLayout,
  IconLayoutDashboard,
  IconPalette,
  IconPuzzle,
} from "@tabler/icons-react";
import type { ComponentType } from "react";

export type StudioTopLevelScreen =
  | "dashboard"
  | "templates"
  | "components"
  | "design-system";

export type StudioCollectionScreen = "templates" | "components";
export type StudioShellScreen = StudioTopLevelScreen | "editor";

type SearchParamReader = Pick<URLSearchParams, "get">;

type NavIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

export type StudioNavItem = {
  id: StudioTopLevelScreen;
  label: string;
  href: string;
  Icon: NavIcon;
};

const STUDIO_SCREEN_HREFS: Record<StudioTopLevelScreen, string> = {
  dashboard: "/studio",
  templates: "/studio?screen=templates",
  components: "/studio?screen=components",
  "design-system": "/studio?screen=design-system",
};

export const STUDIO_NAV_ITEMS: readonly StudioNavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: STUDIO_SCREEN_HREFS.dashboard,
    Icon: IconLayoutDashboard,
  },
  {
    id: "templates",
    label: "Templates",
    href: STUDIO_SCREEN_HREFS.templates,
    Icon: IconLayout,
  },
  {
    id: "components",
    label: "Components",
    href: STUDIO_SCREEN_HREFS.components,
    Icon: IconPuzzle,
  },
  {
    id: "design-system",
    label: "Design system",
    href: STUDIO_SCREEN_HREFS["design-system"],
    Icon: IconPalette,
  },
] as const;

export function studioHrefForScreen(screen: StudioTopLevelScreen): string {
  return STUDIO_SCREEN_HREFS[screen];
}

export function studioHrefForComposition(compositionId: string): string {
  return `${STUDIO_SCREEN_HREFS.dashboard}?composition=${encodeURIComponent(compositionId)}`;
}

export function studioHrefForComponentDocument(componentId: string): string {
  return studioHrefForComposition(studioRowIdForComponent(componentId));
}

export function studioHrefForNewSession(
  kind: "template" | "component",
): string {
  return studioHrefForComposition(studioNewCompositionSessionId(kind));
}

/**
 * Editor routes do not include a top-level `screen` query param.
 * Derive nav highlight from composition id/session id in one place.
 */
export function studioNavScreenForEditorComposition(
  compositionId: string,
): StudioTopLevelScreen {
  const nextSession = parseStudioNewCompositionSessionId(compositionId);
  if (nextSession) {
    return nextSession.kind === "component" ? "components" : "templates";
  }
  return isStudioComponentRowId(compositionId) ? "components" : "templates";
}

export function isStudioCollectionScreen(
  value: string | null,
): value is StudioCollectionScreen {
  return value === "templates" || value === "components";
}

function readCompositionId(searchParams: SearchParamReader): string | null {
  const raw = searchParams.get("composition");
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveStudioShellScreen(searchParams: SearchParamReader): {
  screen: StudioShellScreen;
  compositionId: string | null;
} {
  const requestedScreen = searchParams.get("screen");
  if (isStudioCollectionScreen(requestedScreen)) {
    return { screen: requestedScreen, compositionId: null };
  }
  if (requestedScreen === "design-system") {
    return { screen: "design-system", compositionId: null };
  }

  const compositionId = readCompositionId(searchParams);
  if (compositionId) {
    return { screen: "editor", compositionId };
  }

  return { screen: "dashboard", compositionId: null };
}
