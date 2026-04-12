import type { CollectionConfig } from "payload";
import { createComponentsBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";
import { enrichComponentsEditorFieldsAfterRead } from "../hooks/enrich-components-editor-fields.js";
import {
  syncBuilderComponentAfterChange,
  syncBuilderComponentAfterDelete,
} from "../hooks/sync-builder-component.js";

import { componentAuthoringAccess } from "../access/composition-access.js";
import { authenticatedAccess } from "../access/design-system-access.js";

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
      "Reusable blocks for pages. Compose in the visual builder; publish when ready.",
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
    },
    {
      name: "editorFields",
      type: "json",
      required: true,
      admin: {
        description:
          "CMS-editable fields derived from the composition tree. Distinct from propContract (component props).",
      },
    },
    {
      name: "composition",
      type: "json",
      admin: {
        description:
          "Template tree (v0.4). Edited in the visual builder; publishing updates the live catalog.",
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
    afterChange: [syncBuilderComponentAfterChange],
    afterDelete: [syncBuilderComponentAfterDelete],
  },
};
