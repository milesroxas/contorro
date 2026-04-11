import { createComponentRevisionBeforeValidateHandler } from "@repo/application-page-composer";
import type { CollectionConfig } from "payload";

import { componentAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";

const beforeValidate = createComponentRevisionBeforeValidateHandler();

export const ComponentRevisions: CollectionConfig = {
  slug: "component-revisions",
  admin: {
    useAsTitle: "label",
    defaultColumns: ["definition", "label", "status", "updatedAt"],
  },
  access: {
    read: authenticatedAccess,
    create: componentAuthoringAccess,
    update: componentAuthoringAccess,
    delete: componentAuthoringAccess,
  },
  fields: [
    {
      name: "definition",
      type: "relationship",
      relationTo: "component-definitions",
      required: true,
    },
    {
      name: "label",
      type: "text",
      required: true,
    },
    {
      name: "propContract",
      type: "json",
    },
    {
      name: "slotContract",
      type: "json",
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Submitted", value: "submitted" },
        { label: "Approved", value: "approved" },
        { label: "Published", value: "published" },
      ],
    },
    {
      name: "isBreakingChange",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Breaking contract changes require dependency impact acknowledgment before publish (Phase 6).",
      },
    },
    {
      name: "dependencyImpactAcknowledgedAt",
      type: "date",
      admin: {
        description:
          "Set when an approver acknowledges impacted pages (gateway or admin).",
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
