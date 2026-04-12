import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from "payload";
import pg from "pg";

import { builderRowIdForComponent } from "../builder-row-id.js";

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool | null {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

function isoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
}

/**
 * Mirrors `components` into `builder.compositions` so the gateway builder API
 * can load/save the same composition JSON shape as page templates.
 */
export const syncBuilderComponentAfterChange: CollectionAfterChangeHook =
  async ({ doc }) => {
    const p = getPool();
    if (!p || !doc || typeof doc !== "object") {
      return doc;
    }
    const id = String((doc as { id?: unknown }).id ?? "");
    if (!id) {
      return doc;
    }
    const title = String((doc as { displayName?: unknown }).displayName ?? "");
    const composition = (doc as { composition?: unknown }).composition;
    const row = doc as { updatedAt?: unknown; createdAt?: unknown };
    const updatedAt = isoTimestamp(row.updatedAt);
    const createdAt = isoTimestamp(row.createdAt ?? row.updatedAt);
    const bid = builderRowIdForComponent(id);

    if (composition === undefined || composition === null) {
      await p.query("delete from builder.compositions where id = $1", [bid]);
      return doc;
    }

    await p.query(
      `insert into builder.compositions (
        id, title, slug, composition, catalog_submitted_at, catalog_review_status, created_at, updated_at
      ) values ($1, $2, $3, $4::jsonb, $5::timestamptz, $6, $7::timestamptz, $8::timestamptz)
      on conflict (id) do update set
        title = excluded.title,
        slug = excluded.slug,
        composition = excluded.composition,
        catalog_submitted_at = excluded.catalog_submitted_at,
        catalog_review_status = excluded.catalog_review_status,
        updated_at = excluded.updated_at`,
      [
        bid,
        title || "Untitled",
        bid,
        JSON.stringify(composition),
        null,
        "none",
        createdAt,
        updatedAt,
      ],
    );
    return doc;
  };

export const syncBuilderComponentAfterDelete: CollectionAfterDeleteHook =
  async ({ doc }) => {
    const p = getPool();
    if (!p || !doc || typeof doc !== "object") {
      return;
    }
    const id = String((doc as { id?: unknown }).id ?? "");
    if (!id) {
      return;
    }
    const bid = builderRowIdForComponent(id);
    await p.query("delete from builder.compositions where id = $1", [bid]);
  };
