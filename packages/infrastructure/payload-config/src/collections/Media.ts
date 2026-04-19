import type { CollectionConfig } from "payload";

import { authenticatedAccess, designerOrAdminAccess } from "../access/rbac.js";

export const Media: CollectionConfig = {
  slug: "media",
  admin: {
    group: "Layout & library",
  },
  access: {
    read: () => true,
    create: authenticatedAccess,
    update: authenticatedAccess,
    delete: designerOrAdminAccess,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: true,
};
