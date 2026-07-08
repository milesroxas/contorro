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
    update: designerOrAdminAccess,
    delete: designerOrAdminAccess,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    // No SVG/HTML: scriptable content would be served from the media endpoint.
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ],
  },
};
