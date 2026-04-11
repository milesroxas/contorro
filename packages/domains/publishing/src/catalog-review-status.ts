import { z } from "zod";

/** Page-composition catalog gate (Phase 6). */
export const CatalogReviewStatusSchema = z.enum([
  "none",
  "submitted",
  "approved",
  "rejected",
]);

export type CatalogReviewStatus = z.infer<typeof CatalogReviewStatusSchema>;

export function allowsPagePublish(
  catalogReviewStatus: CatalogReviewStatus,
): boolean {
  return catalogReviewStatus === "none" || catalogReviewStatus === "approved";
}
