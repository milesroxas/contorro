import {
  type DesignTokenSet,
  type DesignTokenSetRepository,
  createDesignTokenSet,
} from "@repo/domains-design-system";
import { err, ok } from "@repo/kernel";
import type { Payload } from "payload";

type TokenRowDoc = {
  id?: string;
  key?: string | null;
  category?: string | null;
  resolvedValue?: string | null;
};

export class PayloadDesignTokenSetRepository
  implements DesignTokenSetRepository
{
  constructor(private readonly payload: Payload) {}

  async findById(id: string): Promise<DesignTokenSet | null> {
    try {
      const doc = await this.payload.findByID({
        collection: "design-token-sets",
        id,
        depth: 0,
      });
      if (!doc) {
        return null;
      }
      return mapDoc(doc as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }

  async save(aggregate: DesignTokenSet) {
    try {
      await this.payload.update({
        collection: "design-token-sets",
        id: aggregate.id,
        data: unmap(aggregate),
      });
      return ok(undefined);
    } catch {
      return err("PERSISTENCE_ERROR" as const);
    }
  }
}

function mapDoc(doc: Record<string, unknown>): DesignTokenSet {
  const tokensRaw = doc.tokens;
  const tokens = Array.isArray(tokensRaw)
    ? (tokensRaw as TokenRowDoc[]).map((t) => ({
        key: String(t.key ?? ""),
        category: String(t.category ?? ""),
        resolvedValue: String(t.resolvedValue ?? ""),
      }))
    : [];

  return createDesignTokenSet({
    id: String(doc.id),
    title: String(doc.title ?? ""),
    scopeKey: String(doc.scopeKey ?? ""),
    tokens,
    hasBeenPublished: Boolean(doc.hasBeenPublished),
  });
}

function unmap(aggregate: DesignTokenSet): Record<string, unknown> {
  return {
    title: aggregate.title,
    scopeKey: aggregate.scopeKey,
    tokens: aggregate.tokens.map((t) => ({
      key: t.key,
      category: t.category,
      resolvedValue: t.resolvedValue,
    })),
    hasBeenPublished: aggregate.hasBeenPublished,
  };
}
