import type { EditorFieldSpec } from "@repo/contracts-zod";
import { parsePayloadMediaRefId } from "@repo/infrastructure-payload-media-client";
import type { Payload } from "payload";

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
    const mid = parsePayloadMediaRefId(rawValues[field.name]);
    if (mid === null) {
      continue;
    }
    resolved[field.name] = await mediaUrlForId(payload, mid);
  }

  return resolved;
}
