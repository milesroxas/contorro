import type { CollectionBeforeValidateHook } from "payload";
import { APIError } from "payload";
import { validateDesignTokenOverrideValue } from "./validate-override.js";

export function createDesignTokenOverrideBeforeValidateHandler(): CollectionBeforeValidateHook {
  return (args) => {
    const { data } = args;
    if (!data) {
      return data;
    }

    const row = data as { override?: unknown };
    if (row.override === undefined || row.override === null) {
      throw new APIError("Override value is required", 400);
    }
    const r = validateDesignTokenOverrideValue(row.override);
    if (!r.ok) {
      throw new APIError("Invalid token override value", 400);
    }
    return data;
  };
}
