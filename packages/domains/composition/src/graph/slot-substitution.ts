import type { EditorSlotContract, PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";
import { type Result, err, ok } from "@repo/kernel";

/**
 * Validates editor-supplied slot values against a published slot contract (required slots).
 */
export function validateEditorSlotValues(
  contract: EditorSlotContract,
  values: Record<string, unknown> | null | undefined,
): Result<void, string> {
  const map =
    values !== null && values !== undefined && typeof values === "object"
      ? (values as Record<string, unknown>)
      : {};
  for (const slot of contract.slots) {
    if (!slot.required) {
      continue;
    }
    const v = map[slot.name];
    if (v === undefined || v === null || v === "") {
      return err(`Missing required slot "${slot.name}"`);
    }
  }
  return ok(undefined);
}

/**
 * Applies resolved slot values onto a template composition (mutates propValues on slotted nodes).
 * Image slots expect `resolvedValues[name]` to be a URL string (resolved in the app layer).
 */
export function mergeSlotValuesIntoComposition(
  composition: PageComposition,
  resolvedValues: Record<string, unknown>,
): PageComposition {
  const nextNodes = { ...composition.nodes };

  for (const [id, node] of Object.entries(composition.nodes)) {
    const cb = node.contentBinding;
    if (cb?.source !== "slot" || !cb.slot) {
      continue;
    }
    const name = cb.slot.name;
    const raw = resolvedValues[name];
    const fallback = cb.slot.defaultValue;
    const effective = raw !== undefined && raw !== null ? raw : fallback;

    const t = cb.slot.type;
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
