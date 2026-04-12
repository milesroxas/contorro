import type { CollectionAfterChangeHook } from "payload";
import pg from "pg";

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

/** Clears mirrored rows when Payload has no document (e.g. orphan after manual DB edits). */
export async function deleteBuilderCompositionBySlug(
  slug: string,
): Promise<void> {
  const p = getPool();
  if (!p) {
    return;
  }
  await p.query("delete from builder.compositions where slug = $1", [slug]);
}

/** Keeps `builder.compositions` in sync when Payload admin mutates `page-compositions` (v0.4). */
function isoTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return new Date().toISOString();
}

export const syncBuilderCompositionAfterChange: CollectionAfterChangeHook =
  async ({ doc }) => {
    const p = getPool();
    if (!p || !doc || typeof doc !== "object") {
      return doc;
    }
    const id = String((doc as { id?: unknown }).id ?? "");
    const title = String((doc as { title?: unknown }).title ?? "");
    const slug = String((doc as { slug?: unknown }).slug ?? "");
    const composition = (doc as { composition?: unknown }).composition;
    const catalogSubmittedAt = (doc as { catalogSubmittedAt?: unknown })
      .catalogSubmittedAt;
    const catalogReviewStatus = String(
      (doc as { catalogReviewStatus?: unknown }).catalogReviewStatus ?? "none",
    );
    const row = doc as { updatedAt?: unknown; createdAt?: unknown };
    const updatedAt = isoTimestamp(row.updatedAt);
    const createdAt = isoTimestamp(row.createdAt ?? row.updatedAt);
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
        id,
        title,
        slug,
        JSON.stringify(composition ?? {}),
        catalogSubmittedAt instanceof Date
          ? catalogSubmittedAt.toISOString()
          : typeof catalogSubmittedAt === "string"
            ? catalogSubmittedAt
            : null,
        catalogReviewStatus,
        createdAt,
        updatedAt,
      ],
    );
    return doc;
  };

/** Removes the mirrored row in `builder.compositions` when a page composition is deleted. */
export const syncBuilderCompositionAfterDelete = async (args: {
  doc: unknown;
}): Promise<void> => {
  const { doc } = args;
  const p = getPool();
  if (!p || !doc || typeof doc !== "object") {
    return;
  }
  const id = String((doc as { id?: unknown }).id ?? "");
  if (!id) {
    return;
  }
  await p.query("delete from builder.compositions where id = $1", [id]);
};
