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

/** When editing a component from a page template, the template to return to. */
export const STUDIO_RETURN_COMPOSITION_PARAM = "returnComposition";
/** Node id in the page template to re-select when returning. */
export const STUDIO_RETURN_NODE_PARAM = "returnNode";
/** Display label for the template (for the return affordance in Component studio). */
export const STUDIO_RETURN_LABEL_PARAM = "returnLabel";
/**
 * Deep link: which node to select when opening a page template in Studio
 * (e.g. after returning from component editing).
 */
export const STUDIO_DEEP_LINK_SELECT_NODE_PARAM = "selectNode";

export type ComponentEditReturnToTemplateFields = {
  templateCompositionId: string;
  instanceNodeId: string;
  templateLabel: string;
};

/**
 * Add return-context query params to a Component studio URL opened from
 * a page template (e.g. “Edit component” from the canvas or layers).
 */
export function appendComponentEditReturnToStudioHref(
  baseRelativeHref: string,
  ctx: ComponentEditReturnToTemplateFields,
): string {
  const u = new URL(baseRelativeHref, "http://localhost");
  u.searchParams.set(
    STUDIO_RETURN_COMPOSITION_PARAM,
    ctx.templateCompositionId,
  );
  u.searchParams.set(STUDIO_RETURN_NODE_PARAM, ctx.instanceNodeId);
  if (ctx.templateLabel.trim() !== "") {
    u.searchParams.set(STUDIO_RETURN_LABEL_PARAM, ctx.templateLabel);
  }
  return `${u.pathname}${u.search}`;
}

/**
 * Href to reopen a page template in Studio, optionally re-selecting a node
 * (library component instance) after returning from Component studio.
 */
export function studioHrefReturnToPageTemplate(
  templateCompositionId: string,
  options?: { selectNodeId?: string },
): string {
  const path = studioHrefForComposition(templateCompositionId);
  if (!options?.selectNodeId || options.selectNodeId.trim() === "") {
    return path;
  }
  const u = new URL(path, "http://localhost");
  u.searchParams.set(
    STUDIO_DEEP_LINK_SELECT_NODE_PARAM,
    options.selectNodeId.trim(),
  );
  return `${u.pathname}${u.search}`;
}

/**
 * User opened Component studio from a page template (“Edit component”); shell and
 * editor can hide top-level nav so only “back to template” leaves this context.
 */
export function isStudioComponentEditFromTemplateRoute(
  searchParams: SearchParamReader,
  compositionId: string | null,
): boolean {
  if (!compositionId || compositionId.trim() === "") {
    return false;
  }
  if (!isStudioComponentRowId(compositionId)) {
    return false;
  }
  const ret = searchParams.get(STUDIO_RETURN_COMPOSITION_PARAM);
  return typeof ret === "string" && ret.trim() !== "";
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
