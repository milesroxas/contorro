import type { CollectionConfig } from "payload";
import {
  composerAuthoringAccess,
  designerOrAdminAccess,
  publishedOrAuthenticatedReadAccess,
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
    maxPerDoc: 25,
  },
  admin: {
    group: "Layout & library",
    useAsTitle: "title",
    defaultColumns: ["title", "_status", "updatedAt"],
    description:
      "Full-page layouts from the builder. Choose one when you create a page (Pages → Page template).",
  },
  access: {
    read: publishedOrAuthenticatedReadAccess,
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
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
