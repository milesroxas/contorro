import type { EditorFieldSpec } from "@repo/contracts-zod";
import type { Payload } from "payload";

/**
 * Resolves image editor-field values from Media IDs to URLs for `mergeEditorFieldValuesIntoComposition`.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Complexity cleanup backlog.
export async function resolveImageEditorFieldValuesForRender(
  payload: Payload,
  fields: EditorFieldSpec[],
  rawValues: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = { ...rawValues };

  for (const field of fields) {
    if (field.type !== "image") {
      continue;
    }
    const raw = rawValues[field.name];
    const mid =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && /^\d+$/.test(raw)
          ? Number.parseInt(raw, 10)
          : raw &&
              typeof raw === "object" &&
              "id" in raw &&
              typeof (raw as { id: unknown }).id === "number"
            ? (raw as { id: number }).id
            : undefined;
    if (mid === undefined) {
      continue;
    }
    try {
      const media = await payload.findByID({
        collection: "media",
        id: mid,
        depth: 0,
      });
      const url =
        media &&
        typeof media === "object" &&
        "url" in media &&
        typeof (media as { url: unknown }).url === "string"
          ? (media as { url: string }).url
          : "";
      resolved[field.name] = url;
    } catch {
      resolved[field.name] = "";
    }
  }

  return resolved;
}
