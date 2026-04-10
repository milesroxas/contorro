import { PageCompositionSchema } from "@repo/contracts-zod";
import { validatePageCompositionInvariants } from "@repo/domains-composition";
import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

export function createPageCompositionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) {
      return data;
    }

    const raw = (data as { composition?: unknown }).composition;
    if (raw === undefined || raw === null) {
      throw new APIError("Composition is required", 400);
    }

    const parsed = PageCompositionSchema.safeParse(raw);
    if (!parsed.success) {
      throw new APIError("Invalid page composition shape", 400);
    }

    const inv = validatePageCompositionInvariants(parsed.data);
    if (!inv.ok) {
      throw new APIError(inv.error, 400);
    }

    return {
      ...data,
      composition: parsed.data,
    };
  };
}
