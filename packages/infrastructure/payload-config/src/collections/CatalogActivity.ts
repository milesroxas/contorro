import type { CollectionConfig } from "payload";

import { authenticatedAccess } from "../access/design-system-access.js";

/** Append-only activity log — Phase 6 (gateway writes via Local API + overrideAccess). */
export const CatalogActivity: CollectionConfig = {
  slug: "catalog-activity",
  admin: {
    useAsTitle: "action",
    defaultColumns: ["action", "resourceType", "resourceId", "createdAt"],
    description: "Publishing and catalog actions (Phase 6).",
  },
  access: {
    read: authenticatedAccess,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "resourceType",
      type: "select",
      required: true,
      options: [
        { label: "Page composition", value: "pageComposition" },
        { label: "Component revision", value: "componentRevision" },
        { label: "Component definition", value: "componentDefinition" },
        { label: "Page", value: "page" },
      ],
    },
    {
      name: "resourceId",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "action",
      type: "select",
      required: true,
      options: [
        { label: "Submit", value: "submit" },
        { label: "Approve", value: "approve" },
        { label: "Reject", value: "reject" },
        { label: "Publish", value: "publish" },
        { label: "Rollback", value: "rollback" },
        { label: "Presence", value: "presence" },
      ],
    },
    {
      name: "actor",
      type: "relationship",
      relationTo: "users",
    },
    {
      name: "metadata",
      type: "json",
    },
  ],
  timestamps: true,
};
