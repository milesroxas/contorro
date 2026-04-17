import type { CollectionConfig } from "payload";
import {
  authenticatedAccess,
  componentAuthoringAccess,
} from "../access/rbac.js";
import { createComponentsBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";
import { enrichComponentsEditorFieldsAfterRead } from "../hooks/enrich-components-editor-fields.js";

const beforeValidate = createComponentsBeforeValidateHandler();

export const Components: CollectionConfig = {
  slug: "components",
  folders: true,
  labels: {
    singular: "Component",
    plural: "Components",
  },
  versions: {
    drafts: true,
  },
  admin: {
    group: "Layout & library",
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "key", "_status", "updatedAt"],
    description:
      "Reusable blocks for your library and pages. Author in the builder; publish when ready.",
    listSearchableFields: ["displayName", "key"],
  },
  access: {
    read: authenticatedAccess,
    create: componentAuthoringAccess,
    update: componentAuthoringAccess,
    delete: componentAuthoringAccess,
  },
  fields: [
    {
      name: "displayName",
      type: "text",
      required: true,
      label: "Title",
    },
    {
      name: "key",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description:
          "Stable id derived from the title when the component is created. Shown for reference only.",
      },
    },
    {
      name: "propContract",
      type: "json",
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: "editorFields",
      type: "json",
      required: true,
      admin: {
        hidden: true,
      },
    },
    {
      name: "composition",
      type: "json",
      admin: {
        hidden: true,
      },
    },
    {
      name: "lastTouchedBy",
      type: "relationship",
      relationTo: "users",
      admin: {
        hidden: true,
      },
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
    beforeChange: [
      ({ data, req }) => {
        if (
          req.user &&
          typeof req.user === "object" &&
          "id" in req.user &&
          typeof (req.user as { id: unknown }).id === "number"
        ) {
          return {
            ...data,
            lastTouchedBy: (req.user as { id: number }).id,
          };
        }
        return data;
      },
    ],
    afterRead: [enrichComponentsEditorFieldsAfterRead],
  },
};
