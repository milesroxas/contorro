import type { SlotDefinition } from "@repo/contracts-zod";
import type { Payload } from "payload";

/**
 * Resolves image slot values from Media IDs to URLs for `mergeSlotValuesIntoComposition`.
 */
export async function resolveImageSlotValuesForRender(
  payload: Payload,
  slots: SlotDefinition[],
  rawValues: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const resolved: Record<string, unknown> = { ...rawValues };

  for (const slot of slots) {
    if (slot.type !== "image") {
      continue;
    }
    const raw = rawValues[slot.name];
    const mid =
      typeof raw === "number"
        ? raw
        : typeof raw === "string" && /^\d+$/.test(raw)
          ? Number.parseInt(raw, 10)
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
      resolved[slot.name] = url;
    } catch {
      resolved[slot.name] = "";
    }
  }

  return resolved;
}
