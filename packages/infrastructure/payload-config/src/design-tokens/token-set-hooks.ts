import { DesignTokenSchema } from "@repo/contracts-zod";
import type {
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";
import { APIError } from "payload";
import {
  findRemovedPublishedTokenKeys,
  validateTokensForSave,
} from "./design-token-set.js";
import {
  type DesignTokenSetPayloadDoc,
  toDesignTokenSetAggregate,
} from "./token-set-doc.js";

function validateAndNormalizeTokenRows(
  tokens: NonNullable<DesignTokenSetPayloadDoc["tokens"]>,
): void {
  for (const row of tokens) {
    const parsed = DesignTokenSchema.safeParse({
      key: row.key,
      mode: row.mode,
      category: row.category,
      resolvedValue: row.resolvedValue,
    });
    if (!parsed.success) {
      throw new APIError("Invalid design token row", 400);
    }
    row.mode = parsed.data.mode;
  }
  const domainCheck = validateTokensForSave(
    tokens.map((t) => ({
      key: String(t.key),
      mode: t.mode === "dark" ? "dark" : "light",
      category: String(t.category),
      resolvedValue: String(t.resolvedValue),
    })),
  );
  if (!domainCheck.ok) {
    throw new APIError(domainCheck.error, 400);
  }
}

export function createDesignTokenSetBeforeValidateHandler(): CollectionBeforeValidateHook {
  return (args) => {
    const { data, operation } = args;
    if (!data) {
      return data;
    }

    const doc = data as DesignTokenSetPayloadDoc;
    const tokens = doc.tokens;

    if (operation === "create" && (!tokens || tokens.length === 0)) {
      throw new APIError("At least one design token is required", 400);
    }

    if (tokens && tokens.length > 0) {
      validateAndNormalizeTokenRows(tokens);
    }

    return data;
  };
}

function mergeIncomingTokenSetDoc(
  incoming: DesignTokenSetPayloadDoc,
  prior: DesignTokenSetPayloadDoc | undefined,
): DesignTokenSetPayloadDoc {
  return {
    ...(prior ?? {}),
    ...incoming,
    id: incoming.id ?? prior?.id,
    title: incoming.title !== undefined ? incoming.title : prior?.title,
    scopeKey:
      incoming.scopeKey !== undefined ? incoming.scopeKey : prior?.scopeKey,
    _status: incoming._status !== undefined ? incoming._status : prior?._status,
    tokens: incoming.tokens !== undefined ? incoming.tokens : prior?.tokens,
  };
}

export function createDesignTokenSetBeforeChangeHandler(): CollectionBeforeChangeHook {
  return (args) => {
    const { data, originalDoc } = args;
    const incoming = data as DesignTokenSetPayloadDoc;
    const prior = originalDoc as DesignTokenSetPayloadDoc | undefined;

    const merged = mergeIncomingTokenSetDoc(incoming, prior);

    const next = toDesignTokenSetAggregate(merged);
    const prevAgg = prior ? toDesignTokenSetAggregate(prior) : null;

    // Additions are always allowed; removing/renaming previously-published keys is
    // rejected only when publishing (draft saves stay unrestricted).
    if (incoming._status === "published") {
      const removedKeys = findRemovedPublishedTokenKeys(prevAgg, next);
      if (removedKeys.length > 0) {
        throw new APIError(
          `Cannot publish: previously published token keys are missing: ${removedKeys.join(
            ", ",
          )}. Published keys may gain new values or new keys, but cannot be removed or renamed.`,
          400,
        );
      }
    }

    const nextStatus =
      incoming._status !== undefined && incoming._status !== null
        ? incoming._status
        : prior?._status;
    if (nextStatus === "published" && !prior?.hasBeenPublished) {
      incoming.hasBeenPublished = true;
    }

    return incoming;
  };
}
