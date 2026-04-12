import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
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
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "_status", "updatedAt"],
    description:
      "Public site page: choose a page template from the builder and/or stack designer blocks. Lexical below is for SEO/social metadata only.",
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
      name: "pageComposition",
      type: "relationship",
      relationTo: "page-compositions",
      label: "Page template",
      admin: {
        description:
          "Full-page layout authored in the builder. Slots marked on the template appear as fields below.",
      },
    },
    {
      name: "templateSlotValues",
      type: "json",
      label: "Template slots",
      defaultValue: {},
      admin: {
        description:
          "Fill content for slots exposed on the page template. Edit structure and slots in the builder.",
        condition: (data) => {
          const row = data as {
            pageComposition?: unknown;
            version?: { pageComposition?: unknown };
          };
          const p = row.pageComposition ?? row.version?.pageComposition;
          return p !== null && p !== undefined && p !== "";
        },
        components: {
          Field: "/components/admin/PageTemplateSlotValuesField",
        },
      },
    },
    {
      name: "content",
      type: "array",
      label: "Blocks",
      labels: {
        singular: "Block",
        plural: "Blocks",
      },
      admin: {
        description:
          "Designer blocks: pick a published component per row (same slot model as the page template). Optional if a page template above already defines the layout.",
        initCollapsed: false,
        isSortable: true,
        components: {
          RowLabel: "/components/admin/BlocksRowLabel",
        },
      },
      fields: [
        {
          name: "componentDefinition",
          type: "relationship",
          relationTo: "component-definitions",
          required: true,
          label: "Block",
          admin: {
            description:
              "Blocks marked visible in the catalog. Pick the block type first.",
          },
          filterOptions: () => ({
            visibleInEditorCatalog: { equals: true },
          }),
        },
        {
          name: "slotValues",
          type: "json",
          label: false,
          required: true,
          defaultValue: {},
          admin: {
            description:
              "Filled from the component’s slot contract (managed in the design system).",
            components: {
              Field: "/components/admin/DesignerSlotValuesField",
            },
          },
        },
      ],
    },
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
  hooks: {
    beforeValidate: [beforeValidatePages],
  },
};
