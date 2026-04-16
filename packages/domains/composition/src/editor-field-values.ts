import type {
  EditorFieldSpec,
  EditorFieldsContract,
  PageComposition,
} from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { err, ok, type Result } from "@repo/kernel";

/**
 * Validates CMS-supplied values against required editor fields.
 */
export function validateEditorFieldValues(
  contract: EditorFieldsContract,
  values: Record<string, unknown> | null | undefined,
): Result<void, string> {
  const map =
    values !== null && values !== undefined && typeof values === "object"
      ? (values as Record<string, unknown>)
      : {};
  for (const field of contract.editorFields) {
    if (!field.required) {
      continue;
    }
    const v = map[field.name];
    if (v === undefined || v === null || v === "") {
      return err(`Missing required editor field "${field.name}"`);
    }
  }
  return ok(undefined);
}

function stringFromUnknownEffective(effective: unknown): string {
  if (typeof effective === "string") {
    return effective;
  }
  if (effective !== undefined && effective !== null) {
    return String(effective);
  }
  return "";
}

function propValuesPatchForEditorField(
  field: EditorFieldSpec,
  effective: unknown,
  prev: Record<string, unknown>,
): Record<string, unknown> {
  const base = { ...prev };
  switch (field.type) {
    case "text":
    case "richText":
      return { ...base, content: stringFromUnknownEffective(effective) };
    case "image":
      return {
        ...base,
        src: typeof effective === "string" ? effective : "",
        alt: typeof prev.alt === "string" ? prev.alt : "",
      };
    case "number": {
      const n = Number(effective);
      return {
        ...base,
        value: Number.isFinite(n) ? n : 0,
      };
    }
    case "boolean":
      return { ...base, checked: Boolean(effective) };
    case "link":
      return { ...base, href: stringFromUnknownEffective(effective) };
    default:
      return base;
  }
}

/**
 * Applies resolved editor field values onto a template composition (mutates propValues on bound nodes).
 * Image fields expect `resolvedValues[name]` to be a URL string (resolved in the app layer).
 */
export function mergeEditorFieldValuesIntoComposition(
  composition: PageComposition,
  resolvedValues: Record<string, unknown>,
): PageComposition {
  const nextNodes = { ...composition.nodes };

  for (const [id, node] of Object.entries(composition.nodes)) {
    const cb = node.contentBinding;
    if (cb?.source !== "editor" || !cb.editorField) {
      continue;
    }
    const name = cb.editorField.name;
    const raw = resolvedValues[name];
    const fallback = cb.editorField.defaultValue;
    const effective = raw !== undefined && raw !== null ? raw : fallback;

    const prev = node.propValues ?? {};
    const patch = propValuesPatchForEditorField(
      cb.editorField,
      effective,
      prev,
    );

    nextNodes[id] = {
      ...node,
      propValues: patch,
    };
  }

  const assembled: PageComposition = {
    ...composition,
    nodes: nextNodes,
  };
  const parsed = PageCompositionSchema.safeParse(assembled);
  if (!parsed.success) {
    return composition;
  }
  return parsed.data;
}
