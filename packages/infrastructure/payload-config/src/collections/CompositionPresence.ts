import type { CollectionConfig } from "payload";

import { composerAuthoringAccess } from "../access/rbac.js";

/** Soft lock while a user has a page template open in the builder. */
export const CompositionPresence: CollectionConfig = {
  slug: "composition-presence",
  admin: {
    hidden: true,
    useAsTitle: "id",
    defaultColumns: ["composition", "holder", "updatedAt"],
    description:
      "Heartbeat while a user has a page template open in the builder.",
  },
  access: {
    read: composerAuthoringAccess,
    create: composerAuthoringAccess,
    update: composerAuthoringAccess,
    delete: composerAuthoringAccess,
  },
  fields: [
    {
      name: "composition",
      type: "relationship",
      relationTo: "page-compositions",
      required: true,
    },
    {
      name: "holder",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
  ],
  timestamps: true,
};
