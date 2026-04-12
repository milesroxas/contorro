import type { CollectionConfig } from "payload";
import { createComponentRevisionBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";

import { componentAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";

const beforeValidate = createComponentRevisionBeforeValidateHandler();

export const ComponentRevisions: CollectionConfig = {
  slug: "component-revisions",
  admin: {
    hidden: true,
    useAsTitle: "label",
    defaultColumns: ["definition", "label", "status", "updatedAt"],
    description:
      "Internal workflow documents (draft → publish). Designers use the builder and gateway; published data lives on component definitions.",
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
      name: "composition",
      type: "json",
      admin: {
        description:
          "Component template composition (v0.4). Promoted to the definition on publish.",
      },
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
          "Breaking contract changes require dependency impact acknowledgment before publish.",
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
