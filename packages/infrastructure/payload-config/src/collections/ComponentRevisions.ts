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
        { label: "Published", value: "published" },
      ],
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
