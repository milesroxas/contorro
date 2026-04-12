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
          "Full-page layout from the builder. Layout slots (where components go) and props are authored there; CMS fields exposed on the template appear below.",
      },
    },
    {
      name: "templateEditorFields",
      type: "json",
      label: "Template CMS fields",
      defaultValue: {},
      admin: {
        description:
          "Values for CMS-managed fields exposed on the page template (defined in the builder). Distinct from Blocks and from component props.",
        condition: (data) => {
          const row = data as {
            pageComposition?: unknown;
            version?: { pageComposition?: unknown };
          };
          const p = row.pageComposition ?? row.version?.pageComposition;
          return p !== null && p !== undefined && p !== "";
        },
        components: {
          Field: "/components/admin/PageTemplateEditorFieldsField",
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
          "Stack components on the page. When the page template has more than one layout region, pick which region each block belongs to.",
        initCollapsed: false,
        isSortable: true,
        components: {
          Field: "/components/admin/PageContentBlocksField",
          RowLabel: "/components/admin/BlocksRowLabel",
        },
      },
      fields: [
        {
          name: "componentDefinition",
          type: "relationship",
          relationTo: "components",
          required: true,
          label: "Component",
          admin: {
            description:
              "Choose a component from the catalog (Components collection).",
          },
          filterOptions: () => ({
            _status: { equals: "published" },
          }),
        },
        {
          name: "layoutSlotId",
          type: "text",
          label: "Layout slot",
          defaultValue: "main",
          admin: {
            description:
              "When the template has several slots, choose which region this block fills (ids match the builder Slot primitives).",
            components: {
              Field: "/components/admin/LayoutSlotIdField",
            },
          },
        },
        {
          name: "editorFieldValues",
          type: "json",
          label: false,
          required: true,
          defaultValue: {},
          admin: {
            description:
              "CMS field values for this block (manifest from the component template).",
            components: {
              Field: "/components/admin/DesignerEditorFieldsField",
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
