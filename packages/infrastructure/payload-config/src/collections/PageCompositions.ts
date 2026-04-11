import { createPageCompositionBeforeValidateHandler } from "@repo/application-page-composer";
import type { CollectionConfig } from "payload";

import { composerAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";
import { designerOrAdminAccess } from "../access/design-system-access.js";

const beforeValidate = createPageCompositionBeforeValidateHandler();

export const PageCompositions: CollectionConfig = {
  slug: "page-compositions",
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Page composition tree (Phase 2). Lexical is not used for body layout.",
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
          "Set when the designer submits this composition for catalog review (gateway POST …/submit).",
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
          "Catalog approval gate (Phase 6). Page publish is blocked while submitted or rejected until approved.",
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
