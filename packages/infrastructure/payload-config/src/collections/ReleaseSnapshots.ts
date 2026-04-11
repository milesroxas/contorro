import type { CollectionConfig } from "payload";

import { authenticatedAccess } from "../access/design-system-access.js";

/** Immutable composition payload at publish time — rollback target (Phase 6). */
export const ReleaseSnapshots: CollectionConfig = {
  slug: "release-snapshots",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["pageComposition", "createdAt"],
    description:
      "Point-in-time composition JSON captured when a page goes live.",
  },
  access: {
    read: authenticatedAccess,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "page",
      type: "relationship",
      relationTo: "pages",
    },
    {
      name: "pageComposition",
      type: "relationship",
      relationTo: "page-compositions",
      required: true,
    },
    {
      name: "snapshotComposition",
      type: "json",
      required: true,
    },
  ],
  timestamps: true,
};
