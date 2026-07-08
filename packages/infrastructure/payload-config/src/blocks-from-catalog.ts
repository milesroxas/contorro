import { lexicalEditor } from "@payloadcms/richtext-lexical";
import {
  BLOCK_CATALOG,
  type BlockCatalogEntry,
  type BlockFieldSpec,
} from "@repo/contracts-zod";
import type { Block, Field } from "payload";

const blockFieldLexical = lexicalEditor();

function buttonGroupField(spec: BlockFieldSpec): Field {
  return {
    name: spec.name,
    type: "group",
    label: spec.label,
    fields: [
      {
        name: "label",
        type: "text",
        label: "Label",
        required: spec.required,
      },
      {
        name: "linkType",
        type: "select",
        label: "Link type",
        options: [
          { label: "URL", value: "url" },
          { label: "Page", value: "page" },
        ],
        defaultValue: "url",
      },
      {
        name: "url",
        type: "text",
        label: "URL",
        admin: {
          condition: (_data, siblingData) =>
            (siblingData as { linkType?: unknown })?.linkType !== "page",
        },
      },
      {
        name: "page",
        type: "relationship",
        relationTo: "pages",
        label: "Page",
        admin: {
          condition: (_data, siblingData) =>
            (siblingData as { linkType?: unknown })?.linkType === "page",
        },
      },
      {
        name: "openInNewTab",
        type: "checkbox",
        label: "Open in new tab",
        defaultValue: false,
      },
    ],
  };
}

function fieldFromSpec(spec: BlockFieldSpec): Field {
  switch (spec.type) {
    case "text":
      return {
        name: spec.name,
        type: "text",
        label: spec.label,
        required: spec.required,
      };
    case "richText":
      return {
        name: spec.name,
        type: "richText",
        label: spec.label,
        required: spec.required,
        editor: blockFieldLexical,
      };
    case "image":
      return {
        name: spec.name,
        type: "upload",
        relationTo: "media",
        label: spec.label,
        required: spec.required,
      };
    case "button":
      return buttonGroupField(spec);
    case "number":
      return {
        name: spec.name,
        type: "number",
        label: spec.label,
        required: spec.required,
      };
    case "checkbox":
      return {
        name: spec.name,
        type: "checkbox",
        label: spec.label,
        required: spec.required,
      };
  }
}

function designField(entry: BlockCatalogEntry): Field {
  return {
    name: "design",
    type: "relationship",
    relationTo: "components",
    required: true,
    label: "Design",
    filterOptions: () => ({
      blockType: { equals: entry.slug },
      _status: { equals: "published" },
    }),
    admin: {
      description: "Choose a published design for this block.",
    },
  };
}

function blockFromCatalogEntry(entry: BlockCatalogEntry): Block {
  return {
    slug: entry.slug,
    labels: {
      singular: entry.label,
      plural: entry.label,
    },
    admin: {
      components: {
        Label: "/components/admin/BlocksRowLabel",
      },
    },
    fields: [designField(entry), ...entry.fields.map(fieldFromSpec)],
  };
}

/** Native Payload `Block` configs generated from the code-defined block catalog. */
export function blocksFromCatalog(): Block[] {
  return BLOCK_CATALOG.map(blockFromCatalogEntry);
}
