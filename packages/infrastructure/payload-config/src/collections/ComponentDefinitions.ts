import type { CollectionConfig } from "payload";
import { createComponentDefinitionBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";
import { enrichComponentDefinitionSlotContractAfterRead } from "../hooks/enrich-component-definition-slot-contract.js";

import { componentAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";

const beforeValidate = createComponentDefinitionBeforeValidateHandler();

export const ComponentDefinitions: CollectionConfig = {
  slug: "component-definitions",
  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["key", "displayName", "updatedAt"],
    description:
      "Published block types: contracts and template composition editors use on pages. Drafts are authored as component revisions (hidden) and promoted here when published from the builder.",
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
      name: "composition",
      type: "json",
      admin: {
        description:
          "Published template tree (v0.4). Copied from the revision on publish; used when rendering DesignerComponent blocks.",
      },
    },
    {
      name: "visibleInEditorCatalog",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "When enabled, site editors can pick this block on pages. Publishing a revision from the builder sets this on; turn off to hide without deleting.",
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
    afterRead: [enrichComponentDefinitionSlotContractAfterRead],
  },
};
