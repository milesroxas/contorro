import type {
  EditorFieldsContract,
  PageComposition,
} from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { type Result, err, ok } from "@repo/kernel";

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

/**
 * Applies resolved editor field values onto a template composition (mutates propValues on bound nodes).
 * Image fields expect `resolvedValues[name]` to be a URL string (resolved in the app layer).
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
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

    const t = cb.editorField.type;
    const prev = node.propValues ?? {};
    let patch: Record<string, unknown> = { ...prev };

    if (t === "text" || t === "richText") {
      patch = {
        ...patch,
        content:
          typeof effective === "string"
            ? effective
            : effective !== undefined && effective !== null
              ? String(effective)
              : "",
      };
    } else if (t === "image") {
      patch = {
        ...patch,
        src: typeof effective === "string" ? effective : "",
        alt: typeof prev.alt === "string" ? prev.alt : "",
      };
    } else if (t === "number") {
      const n = Number(effective);
      patch = {
        ...patch,
        value: Number.isFinite(n) ? n : 0,
      };
    } else if (t === "boolean") {
      patch = { ...patch, checked: Boolean(effective) };
    } else if (t === "link") {
      patch = {
        ...patch,
        href:
          typeof effective === "string"
            ? effective
            : effective !== undefined && effective !== null
              ? String(effective)
              : "",
      };
    }

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
