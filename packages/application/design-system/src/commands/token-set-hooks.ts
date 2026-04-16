import { DesignTokenSchema } from "@repo/contracts-zod";
import {
  assertTokenKeyStability,
  TOKEN_PUBLISHED,
  type TokenPublishedPayload,
  validateTokensForSave,
} from "@repo/domains-design-system";
import type { DomainEvent, EventBus } from "@repo/kernel";
import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeValidateHook,
} from "payload";
import { APIError } from "payload";
import {
  type DesignTokenSetPayloadDoc,
  toDesignTokenSetAggregate,
} from "../lib/token-set-doc.js";

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
    throw new APIError("Design token validation failed", 400);
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

    const stable = assertTokenKeyStability(prevAgg, next);
    if (!stable.ok) {
      throw new APIError(
        "Token keys are immutable after the set has been published",
        400,
      );
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

export function createDesignTokenSetAfterChangeHandler(deps: {
  eventBus: EventBus;
}): CollectionAfterChangeHook {
  return async (args) => {
    const { doc, previousDoc } = args;
    const current = doc as DesignTokenSetPayloadDoc & {
      _status?: string | null;
    };
    const prev = previousDoc as
      | (DesignTokenSetPayloadDoc & { _status?: string | null })
      | undefined;

    const isPublished = current._status === "published";
    const wasPublished = prev?._status === "published";
    if (!isPublished || wasPublished) {
      return doc;
    }

    const payload: TokenPublishedPayload = {
      tokenSetId: String(current.id ?? ""),
      scopeKey: String(current.scopeKey ?? ""),
    };

    const event = {
      type: TOKEN_PUBLISHED,
      occurredAt: new Date(),
      payload,
    } satisfies DomainEvent<typeof TOKEN_PUBLISHED, TokenPublishedPayload>;

    await deps.eventBus.publish(event);
    return doc;
  };
}
