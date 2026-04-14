const NEW_COMPOSITION_SESSION_PREFIX = "new:";
const NEW_TEMPLATE_SESSION_PREFIX = "new:template:";
const NEW_COMPONENT_SESSION_PREFIX = "new:component:";

export type NewStudioCompositionKind = "template" | "component";

export function studioNewCompositionSessionId(
  kind: NewStudioCompositionKind,
): string {
  return `${NEW_COMPOSITION_SESSION_PREFIX}${kind}:${crypto.randomUUID()}`;
}

export function parseStudioNewCompositionSessionId(
  value: string,
): { kind: NewStudioCompositionKind } | null {
  if (value.startsWith(NEW_TEMPLATE_SESSION_PREFIX)) {
    return { kind: "template" };
  }
  if (value.startsWith(NEW_COMPONENT_SESSION_PREFIX)) {
    return { kind: "component" };
  }
  return null;
}

export function isStudioNewCompositionSessionId(value: string): boolean {
  return parseStudioNewCompositionSessionId(value) !== null;
}

export function isStudioNewComponentSessionId(value: string): boolean {
  return value.startsWith(NEW_COMPONENT_SESSION_PREFIX);
}
