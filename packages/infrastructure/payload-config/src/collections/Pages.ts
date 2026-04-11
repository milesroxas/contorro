import { createPagesBeforeValidateHandler } from "@repo/application-page-composer";
import type { CollectionConfig } from "payload";

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
      "Public site page: references a page composition. Lexical fields are for page-level metadata only (SEO, social).",
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
      required: true,
    },
    {
      name: "seoDescription",
      type: "richText",
      label: "SEO description",
      admin: {
        description: "Metadata only — not composition body text.",
      },
    },
    {
      name: "socialShareText",
      type: "richText",
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
