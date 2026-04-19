import type { PageComposition } from "@repo/contracts-zod";
import { editorFieldSpecsFromComposition } from "@repo/domains-composition";
import {
  fetchMediaRecordById,
  parsePayloadMediaRefId,
} from "@repo/infrastructure-payload-media-client";

export function editorFieldImageValuesNeedMediaFetch(
  composition: PageComposition,
  values: Record<string, unknown>,
): boolean {
  for (const field of editorFieldSpecsFromComposition(composition)) {
    if (field.type !== "image") {
      continue;
    }
    if (parsePayloadMediaRefId(values[field.name]) !== null) {
      return true;
    }
  }
  return false;
}

/**
 * Maps image editor-field Payload media refs in `rawValues` to URL strings for
 * {@link mergeEditorFieldValuesIntoComposition} (client / Studio canvas).
 */
export async function resolveEditorFieldImageValuesForCanvas(
  composition: PageComposition,
  rawValues: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = { ...rawValues };
  for (const field of editorFieldSpecsFromComposition(composition)) {
    if (field.type !== "image") {
      continue;
    }
    const mid = parsePayloadMediaRefId(rawValues[field.name]);
    if (mid === null) {
      continue;
    }
    const media = await fetchMediaRecordById(mid);
    resolved[field.name] = media?.url ?? "";
  }
  return resolved;
}
