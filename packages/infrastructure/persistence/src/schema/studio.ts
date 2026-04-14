import {
  index,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Postgres schema name remains `builder` (existing deployments); tables hold Studio-authored trees. */
export const studioSchema = pgSchema("builder");

/** Composition trees authored in Studio; ids match legacy `page_compositions.id` as text. */
export const studioCompositions = studioSchema.table(
  "compositions",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    composition: jsonb("composition").notNull(),
    catalogSubmittedAt: timestamp("catalog_submitted_at", {
      withTimezone: true,
      mode: "string",
    }),
    catalogReviewStatus: text("catalog_review_status")
      .notNull()
      .default("none"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("builder_compositions_slug_idx").on(t.slug),
    index("builder_compositions_updated_at_idx").on(t.updatedAt),
  ],
);
