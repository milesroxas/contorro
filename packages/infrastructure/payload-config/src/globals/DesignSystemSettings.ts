import type { GlobalConfig } from "payload";
import { authenticatedAccess, designerOrAdminAccess } from "../access/rbac.js";

export const DesignSystemSettings: GlobalConfig = {
  slug: "design-system-settings",
  label: "Design system",
  admin: {
    group: "Site globals",
    description: "Default published token set and active brand scope.",
  },
  access: {
    read: authenticatedAccess,
    update: designerOrAdminAccess,
  },
  fields: [
    {
      name: "defaultTokenSet",
      type: "relationship",
      relationTo: "design-token-sets",
    },
    {
      name: "activeBrandKey",
      type: "text",
    },
    {
      name: "activeColorMode",
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
  ],
};
