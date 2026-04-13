const NEW_COMPOSITION_SESSION_PREFIX = "new:";
const NEW_TEMPLATE_SESSION_PREFIX = "new:template:";
const NEW_COMPONENT_SESSION_PREFIX = "new:component:";

export type NewBuilderCompositionKind = "template" | "component";

export function builderNewCompositionSessionId(
  kind: NewBuilderCompositionKind,
): string {
  return `${NEW_COMPOSITION_SESSION_PREFIX}${kind}:${crypto.randomUUID()}`;
}

export function parseBuilderNewCompositionSessionId(
  value: string,
): { kind: NewBuilderCompositionKind } | null {
  if (value.startsWith(NEW_TEMPLATE_SESSION_PREFIX)) {
    return { kind: "template" };
  }
  if (value.startsWith(NEW_COMPONENT_SESSION_PREFIX)) {
    return { kind: "component" };
  }
  return null;
}

export function isBuilderNewCompositionSessionId(value: string): boolean {
  return parseBuilderNewCompositionSessionId(value) !== null;
}

export function isBuilderNewComponentSessionId(value: string): boolean {
  return value.startsWith(NEW_COMPONENT_SESSION_PREFIX);
}
