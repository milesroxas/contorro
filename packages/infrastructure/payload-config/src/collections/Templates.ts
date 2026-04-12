import type { CollectionConfig } from "payload";

import { composerAuthoringAccess } from "../access/composition-access.js";
import { designerOrAdminAccess } from "../access/design-system-access.js";

/** Page templates for editor “create from template” (architecture spec §9.1). */
export const Templates: CollectionConfig = {
  slug: "templates",
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Reusable starting points for Pages. Editors instantiate from approved templates.",
  },
  access: {
    read: composerAuthoringAccess,
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
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "description",
      type: "textarea",
    },
    {
      name: "sourceComposition",
      type: "relationship",
      relationTo: "page-compositions",
      required: true,
      label: "Page template",
      admin: {
        description:
          "Builder document copied when an editor creates a page from this template.",
      },
    },
  ],
};
