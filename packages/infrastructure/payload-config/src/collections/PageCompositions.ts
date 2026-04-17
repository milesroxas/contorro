import type { CollectionConfig } from "payload";
import {
  authenticatedAccess,
  composerAuthoringAccess,
  designerOrAdminAccess,
} from "../access/rbac.js";
import { createPageCompositionBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";

const beforeValidate = createPageCompositionBeforeValidateHandler();

export const PageCompositions: CollectionConfig = {
  slug: "page-compositions",
  labels: {
    singular: "Page template",
    plural: "Page templates",
  },
  versions: {
    drafts: true,
  },
  admin: {
    group: "Layout & library",
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "updatedAt"],
    description:
      "Full-page layouts from the builder. Choose one when you create a page (Pages → Page template).",
  },
  access: {
    read: authenticatedAccess,
    create: composerAuthoringAccess,
    update: composerAuthoringAccess,
    delete: designerOrAdminAccess,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: "composition",
      type: "json",
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: "catalogSubmittedAt",
      type: "date",
      admin: {
        hidden: true,
      },
    },
    {
      name: "catalogReviewStatus",
      type: "select",
      required: true,
      defaultValue: "none",
      options: [
        { label: "None", value: "none" },
        { label: "Submitted", value: "submitted" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      admin: {
        hidden: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
