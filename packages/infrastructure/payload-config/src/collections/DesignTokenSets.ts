import {
  createDesignTokenSetAfterChangeHandler,
  createDesignTokenSetBeforeChangeHandler,
  createDesignTokenSetBeforeValidateHandler,
} from "@repo/application-design-system";
import { defaultInProcessEventBus } from "@repo/infrastructure-event-bus";
import type { CollectionConfig } from "payload";
import {
  authenticatedAccess,
  designerOrAdminAccess,
} from "../access/design-system-access.js";
import { tokenCategoryFieldOptions } from "./token-category-options.js";

const beforeValidate = createDesignTokenSetBeforeValidateHandler();
const beforeChange = createDesignTokenSetBeforeChangeHandler();
const afterChange = createDesignTokenSetAfterChangeHandler({
  eventBus: defaultInProcessEventBus,
});

export const DesignTokenSets: CollectionConfig = {
  slug: "design-token-sets",
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "scopeKey", "_status", "updatedAt"],
    description:
      "Published token sets emit `design-system.token-published` for downstream compilation.",
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
    afterChange: [afterChange],
  },
};
