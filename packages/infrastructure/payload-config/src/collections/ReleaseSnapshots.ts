import type { CollectionConfig } from "payload";

import { authenticatedAccess } from "../access/design-system-access.js";

/** Immutable snapshot at publish time — rollback target. */
export const ReleaseSnapshots: CollectionConfig = {
  slug: "release-snapshots",
  admin: {
    hidden: true,
    useAsTitle: "id",
    defaultColumns: ["pageComposition", "createdAt"],
    description:
      "Point-in-time page template tree captured when a page goes live.",
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
