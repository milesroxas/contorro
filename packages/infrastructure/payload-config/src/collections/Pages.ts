import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import { blocksFromCatalog } from "../blocks-from-catalog.js";
import { createPagesBeforeValidateHandler } from "../collection-hooks/page-and-component-validation.js";

const pageMetadataLexical = lexicalEditor();

import {
  pagesCreateAccess,
  pagesDeleteAccess,
  pagesReadAccess,
  pagesUpdateAccess,
} from "../access/page-access.js";

const beforeValidatePages = createPagesBeforeValidateHandler();

function previewUrlForDoc(doc: unknown): string {
  if (
    typeof doc !== "object" ||
    doc === null ||
    !("slug" in doc) ||
    typeof (doc as { slug?: unknown }).slug !== "string"
  ) {
    return "";
  }
  const slug = (doc as { slug: string }).slug;
  const site = process.env.SITE_URL;
  const secret = process.env.PREVIEW_SECRET;
  if (!site || !secret) {
    return "";
  }
  const base = site.replace(/\/$/, "");
  return `${base}/api/preview?secret=${encodeURIComponent(secret)}&slug=${encodeURIComponent(slug)}`;
}

export const Pages: CollectionConfig = {
  slug: "pages",
  versions: {
    drafts: true,
    maxPerDoc: 25,
  },
  admin: {
    group: "Pages",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Site page: choose a page template and place typed content blocks in its layout regions. Metadata fields in Page setup are for SEO and social metadata only—not page body content.",
    preview: (doc) => previewUrlForDoc(doc),
  },
  access: {
    read: pagesReadAccess,
    create: pagesCreateAccess,
    update: pagesUpdateAccess,
    delete: pagesDeleteAccess,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Page setup",
          description: "Set the page identity and metadata.",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "title",
                  type: "text",
                  required: true,
                  admin: {
                    width: "50%",
                  },
                },
                {
                  name: "slug",
                  type: "text",
                  required: true,
                  unique: true,
                  index: true,
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "collapsible",
              label: "Metadata",
              admin: {
                initCollapsed: false,
              },
              fields: [
                {
                  name: "seoDescription",
                  type: "richText",
                  editor: pageMetadataLexical,
                  label: "SEO description",
                  admin: {
                    description: "Metadata only — not composition body text.",
                  },
                },
                {
                  name: "socialShareText",
                  type: "richText",
                  editor: pageMetadataLexical,
                  label: "Social share text",
                  admin: {
                    description: "Metadata only — not composition body text.",
                  },
                },
              ],
            },
          ],
        },
        {
          label: "Content",
          description:
            "Choose a page template, then place content blocks in its layout regions.",
          fields: [
            {
              name: "pageComposition",
              type: "relationship",
              relationTo: "page-compositions",
              label: "Page template",
              admin: {
                description:
                  "Full-page layout from the builder. Layout regions (where blocks go) are authored there.",
              },
            },
            {
              name: "contentSlots",
              type: "array",
              label: "Layout regions",
              labels: {
                singular: "Layout region",
                plural: "Layout regions",
              },
              admin: {
                className: "payload-content-slots-field",
                description:
                  "Regions match the selected page template’s layout slots. Add blocks inside each region; reordering regions is disabled.",
                initCollapsed: false,
                isSortable: false,
                components: {
                  RowLabel: "/components/admin/ContentSlotRowLabel",
                },
              },
              fields: [
                {
                  name: "slotId",
                  type: "text",
                  required: true,
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: "blocks",
                  type: "blocks",
                  label: "Blocks",
                  labels: {
                    singular: "Block",
                    plural: "Blocks",
                  },
                  admin: {
                    initCollapsed: false,
                  },
                  blocks: blocksFromCatalog(),
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    beforeValidate: [beforeValidatePages],
  },
};
