import type { EditorFieldSpec } from "@repo/contracts-zod";
import type { Payload } from "payload";

function parseMediaIdFromRaw(raw: unknown): number | undefined {
  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "string" && /^\d+$/.test(raw)) {
    return Number.parseInt(raw, 10);
  }
  if (
    raw &&
    typeof raw === "object" &&
    "id" in raw &&
    typeof (raw as { id: unknown }).id === "number"
  ) {
    return (raw as { id: number }).id;
  }
  return undefined;
}

async function mediaUrlForId(payload: Payload, mid: number): Promise<string> {
  try {
    const media = await payload.findByID({
      collection: "media",
      id: mid,
      depth: 0,
    });
    if (
      media &&
      typeof media === "object" &&
      "url" in media &&
      typeof (media as { url: unknown }).url === "string"
    ) {
      return (media as { url: string }).url;
    }
    return "";
  } catch {
    return "";
  }
}

/**
 * Resolves image editor-field values from Media IDs to URLs for `mergeEditorFieldValuesIntoComposition`.
 */
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
    const mid = parseMediaIdFromRaw(rawValues[field.name]);
    if (mid === undefined) {
      continue;
    }
    resolved[field.name] = await mediaUrlForId(payload, mid);
  }

  return resolved;
}
