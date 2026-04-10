import { PropContractSchema, SlotContractSchema } from "@repo/contracts-zod";
import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";

export function createComponentDefinitionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) {
      return data;
    }

    const row = data as {
      propContract?: unknown;
      slotContract?: unknown;
    };

    const p = PropContractSchema.safeParse(row.propContract);
    if (!p.success) {
      throw new APIError("Invalid propContract", 400);
    }

    const s = SlotContractSchema.safeParse(row.slotContract);
    if (!s.success) {
      throw new APIError("Invalid slotContract", 400);
    }

    return {
      ...data,
      propContract: p.data,
      slotContract: s.data,
    };
  };
}

export function createComponentRevisionBeforeValidateHandler(): CollectionBeforeValidateHook {
  return ({ data }) => {
    if (!data) {
      return data;
    }

    const row = data as {
      propContract?: unknown;
      slotContract?: unknown;
    };

    let next = data as Record<string, unknown>;

    if (row.propContract !== undefined) {
      const p = PropContractSchema.safeParse(row.propContract);
      if (!p.success) {
        throw new APIError("Invalid propContract", 400);
      }
      next = { ...next, propContract: p.data };
    }
    if (row.slotContract !== undefined) {
      const s = SlotContractSchema.safeParse(row.slotContract);
      if (!s.success) {
        throw new APIError("Invalid slotContract", 400);
      }
      next = { ...next, slotContract: s.data };
    }

    return next;
  };
}
