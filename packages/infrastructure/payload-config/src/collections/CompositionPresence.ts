import type { CollectionConfig } from "payload";

import { composerAuthoringAccess } from "../access/composition-access.js";

/** Soft lock / presence — Phase 6. */
export const CompositionPresence: CollectionConfig = {
  slug: "composition-presence",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["composition", "holder", "updatedAt"],
    description:
      "Heartbeat while a user has a composition open in the builder/composer.",
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
