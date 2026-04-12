import type { CollectionConfig } from "payload";
import { createPageCompositionBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";
import {
  syncBuilderCompositionAfterChange,
  syncBuilderCompositionAfterDelete,
} from "../hooks/sync-builder-composition.js";

import { composerAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";
import { designerOrAdminAccess } from "../access/design-system-access.js";

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
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Reusable full-page layouts from the builder. Pick one when creating a page (Pages → Page template).",
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
    },
    {
      name: "composition",
      type: "json",
      required: true,
    },
    {
      name: "catalogSubmittedAt",
      type: "date",
      admin: {
        readOnly: true,
        description:
          "Set when the designer submits this template for catalog review.",
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
        description:
          "Catalog approval gate: publishing can be blocked while submitted or rejected.",
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
    afterChange: [syncBuilderCompositionAfterChange],
    afterDelete: [syncBuilderCompositionAfterDelete],
  },
};
