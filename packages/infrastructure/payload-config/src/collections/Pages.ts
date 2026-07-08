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

/**
 * Draft preview through the authenticated enter route — never exposes a
 * preview secret in the URL (the route checks the admin session and role).
 */
function previewPathForDoc(doc: unknown): string {
  if (
    typeof doc !== "object" ||
    doc === null ||
    !("id" in doc) ||
    (doc as { id?: unknown }).id === undefined ||
    (doc as { id?: unknown }).id === null
  ) {
    return "";
  }
  const id = String((doc as { id: string | number }).id);
  return `/api/preview/enter?pageId=${encodeURIComponent(id)}`;
}

function livePreviewUrlForData(data: Record<string, unknown> | undefined) {
  return typeof data?.slug === "string" && data.slug !== ""
    ? `/${data.slug}`
    : "/";
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
    preview: (doc) => previewPathForDoc(doc),
    livePreview: {
      url: ({ data }) => livePreviewUrlForData(data),
      breakpoints: [
        { name: "mobile", label: "Mobile", width: 390, height: 844 },
        { name: "tablet", label: "Tablet", width: 834, height: 1194 },
        { name: "desktop", label: "Desktop", width: 1440, height: 900 },
      ],
    },
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
