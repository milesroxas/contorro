import {
  type EditorFieldSpec,
  type EditorFieldsContract,
  type PageComposition,
  PageCompositionSchema,
  parseEditorFieldsContract,
} from "@repo/contracts-zod";

/** Collects v0.4 editor field specs from nodes whose `contentBinding.source` is `editor`. */
export function editorFieldSpecsFromComposition(
  c: PageComposition,
): EditorFieldSpec[] {
  const out: EditorFieldSpec[] = [];
  for (const node of Object.values(c.nodes)) {
    const cb = node.contentBinding;
    if (cb?.source === "editor" && cb.editorField) {
      out.push(cb.editorField);
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** Canonical `{ editorFields }` document for Payload — derived from the template tree. */
export function editorFieldsContractFromComposition(
  c: PageComposition,
): EditorFieldsContract {
  return { editorFields: editorFieldSpecsFromComposition(c) };
}

/**
 * Effective editor-fields manifest for a published component definition.
 * The composition tree is canonical: when it parses, fields are derived from it; otherwise
 * stored `editorFields` JSON is used (legacy / partial documents).
 */
export function resolveEditorFieldsContractForDefinition(args: {
  composition: unknown;
  editorFields?: unknown;
}): { ok: true; contract: EditorFieldsContract } | { ok: false } {
  const { composition, editorFields } = args;
  if (composition !== undefined && composition !== null) {
    const comp = PageCompositionSchema.safeParse(composition);
    if (comp.success) {
      return {
        ok: true,
        contract: editorFieldsContractFromComposition(comp.data),
      };
    }
  }
  const parsed = parseEditorFieldsContract(
    editorFields ?? { editorFields: [] },
  );
  if (parsed.ok) {
    return { ok: true, contract: parsed.data };
  }
  return { ok: false };
}
