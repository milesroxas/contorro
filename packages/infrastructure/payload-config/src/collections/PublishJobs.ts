import type { CollectionConfig } from "payload";

import { componentAuthoringAccess } from "../access/composition-access.js";

/** Idempotent publish job records (Phase 6). */
export const PublishJobs: CollectionConfig = {
  slug: "publish-jobs",
  admin: {
    useAsTitle: "idempotencyKey",
    defaultColumns: ["kind", "status", "idempotencyKey", "createdAt"],
    description: "Deduped publish operations; succeeded + same key is a no-op.",
  },
  access: {
    read: componentAuthoringAccess,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "idempotencyKey",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "kind",
      type: "select",
      required: true,
      options: [
        { label: "Page publish", value: "page_publish" },
        {
          label: "Component revision publish",
          value: "component_revision_publish",
        },
        { label: "Rollback", value: "rollback" },
      ],
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Succeeded", value: "succeeded" },
        { label: "Failed", value: "failed" },
      ],
    },
    {
      name: "targetPage",
      type: "relationship",
      relationTo: "pages",
    },
    {
      name: "targetRevision",
      type: "relationship",
      relationTo: "component-revisions",
    },
    {
      name: "releaseSnapshot",
      type: "relationship",
      relationTo: "release-snapshots",
    },
    {
      name: "errorMessage",
      type: "text",
    },
  ],
  timestamps: true,
};
