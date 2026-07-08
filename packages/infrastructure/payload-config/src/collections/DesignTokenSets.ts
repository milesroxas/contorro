import type { CollectionConfig } from "payload";
import { authenticatedAccess, designerOrAdminAccess } from "../access/rbac.js";
import {
  createDesignTokenSetBeforeChangeHandler,
  createDesignTokenSetBeforeValidateHandler,
} from "../design-tokens/token-set-hooks.js";
import { tokenCategoryFieldOptions } from "./token-category-options.js";

const beforeValidate = createDesignTokenSetBeforeValidateHandler();
const beforeChange = createDesignTokenSetBeforeChangeHandler();

export const DesignTokenSets: CollectionConfig = {
  slug: "design-token-sets",
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  admin: {
    group: "Layout & library",
    useAsTitle: "title",
    defaultColumns: ["title", "scopeKey", "_status", "updatedAt"],
    description:
      "Design tokens for your brands and themes. Publishing updates the active design system.",
  },
  access: {
    read: authenticatedAccess,
    create: designerOrAdminAccess,
    update: designerOrAdminAccess,
    delete: designerOrAdminAccess,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "scopeKey",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "hasBeenPublished",
      type: "checkbox",
      defaultValue: false,
      admin: {
        hidden: true,
      },
    },
    {
      name: "tokens",
      type: "array",
      minRows: 1,
      required: true,
      labels: {
        singular: "Token",
        plural: "Tokens",
      },
      fields: [
        {
          name: "key",
          type: "text",
          required: true,
        },
        {
          name: "category",
          type: "select",
          required: true,
          options: [...tokenCategoryFieldOptions],
        },
        {
          name: "mode",
          type: "select",
          required: true,
          defaultValue: "light",
          options: [
            {
              label: "Light",
              value: "light",
            },
            {
              label: "Dark",
              value: "dark",
            },
          ],
        },
        {
          name: "resolvedValue",
          type: "text",
          required: true,
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
    beforeChange: [beforeChange],
  },
};
