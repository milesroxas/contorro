import { createComponentDefinitionBeforeValidateHandler } from "@repo/application-page-composer";
import type { CollectionConfig } from "payload";

import { componentAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";

const beforeValidate = createComponentDefinitionBeforeValidateHandler();

export const ComponentDefinitions: CollectionConfig = {
  slug: "component-definitions",
  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["key", "displayName", "updatedAt"],
  },
  access: {
    read: authenticatedAccess,
    create: componentAuthoringAccess,
    update: componentAuthoringAccess,
    delete: componentAuthoringAccess,
  },
  fields: [
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "displayName",
      type: "text",
      required: true,
    },
    {
      name: "propContract",
      type: "json",
      required: true,
    },
    {
      name: "slotContract",
      type: "json",
      required: true,
    },
    {
      name: "visibleInEditorCatalog",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "When enabled, content editors can see this definition in the composer catalog. Leave off until the design is approved.",
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
