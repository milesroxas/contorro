import { createDesignTokenOverrideBeforeValidateHandler } from "@repo/application-design-system";
import type { CollectionConfig } from "payload";
import {
  authenticatedAccess,
  designerOrAdminAccess,
} from "../access/design-system-access.js";

const beforeValidate = createDesignTokenOverrideBeforeValidateHandler();

export const DesignTokenOverrides: CollectionConfig = {
  slug: "design-token-overrides",
  admin: {
    group: "Layout & library",
    useAsTitle: "tokenKey",
    defaultColumns: ["tokenSet", "tokenKey", "updatedAt"],
  },
  access: {
    read: authenticatedAccess,
    create: designerOrAdminAccess,
    update: designerOrAdminAccess,
    delete: designerOrAdminAccess,
  },
  fields: [
    {
      name: "tokenSet",
      type: "relationship",
      relationTo: "design-token-sets",
      required: true,
    },
    {
      name: "tokenKey",
      type: "text",
      required: true,
    },
    {
      name: "override",
      type: "json",
      required: true,
    },
  ],
  hooks: {
    beforeValidate: [beforeValidate],
  },
};
