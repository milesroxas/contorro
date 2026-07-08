import { BLOCK_CATALOG } from "@repo/contracts-zod";
import type { CollectionConfig } from "payload";
import {
  componentAuthoringAccess,
  publishedOrAuthenticatedReadAccess,
} from "../access/rbac.js";
import { createComponentsBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";

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
    maxPerDoc: 25,
  },
  admin: {
    group: "Layout & library",
    useAsTitle: "displayName",
    defaultColumns: ["displayName", "key", "blockType", "_status", "updatedAt"],
    description:
      "Block designs and library parts. Author in the builder; set a block type to make a design selectable on pages.",
    listSearchableFields: ["displayName", "key"],
  },
  access: {
    read: publishedOrAuthenticatedReadAccess,
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
      name: "blockType",
      type: "select",
      label: "Block type",
      index: true,
      options: BLOCK_CATALOG.map((entry) => ({
        label: entry.label,
        value: entry.slug,
      })),
      admin: {
        position: "sidebar",
        isClearable: true,
        description:
          "Content contract this design implements. Leave empty for a design-only library part.",
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
  },
};
