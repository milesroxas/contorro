import type { GlobalConfig } from "payload";
import {
  authenticatedAccess,
  designerOrAdminAccess,
} from "../access/design-system-access.js";

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
  ],
};
