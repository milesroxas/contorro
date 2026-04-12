import type { EditorFieldSpec } from "@repo/contracts-zod";

export type EditorFieldsContractBreakingReason =
  | "editor_field_removed"
  | "editor_field_type_changed"
  | "became_required_without_default";

function indexFields(fields: EditorFieldSpec[]): Map<string, EditorFieldSpec> {
  const m = new Map<string, EditorFieldSpec>();
  for (const f of fields) {
    m.set(f.name, f);
  }
  return m;
}

/**
 * Breaking changes when republishing (v0.4). First publish (no previous fields) is non-breaking.
 */
export function editorFieldsContractBreakingChanges(
  previous: EditorFieldSpec[] | undefined,
  next: EditorFieldSpec[] | undefined,
): EditorFieldsContractBreakingReason[] {
  const prevArr = previous ?? [];
  const nextArr = next ?? [];

  if (prevArr.length === 0) {
    return [];
  }

  if (nextArr.length === 0) {
    return ["editor_field_removed"];
  }

  const prev = indexFields(prevArr);
  const nxt = indexFields(nextArr);
  const reasons: EditorFieldsContractBreakingReason[] = [];

  for (const [name, p] of prev) {
    const q = nxt.get(name);
    if (!q) {
      reasons.push("editor_field_removed");
      continue;
    }
    if (p.type !== q.type) {
      reasons.push("editor_field_type_changed");
    }
    if (!p.required && q.required && q.defaultValue === undefined) {
      reasons.push("became_required_without_default");
    }
  }

  return reasons;
}
