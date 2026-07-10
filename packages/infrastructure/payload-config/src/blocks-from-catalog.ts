import { lexicalEditor } from "@payloadcms/richtext-lexical";
import {
  BLOCK_CATALOG,
  type BlockCatalogEntry,
  type BlockFieldSpec,
} from "@repo/contracts-zod";
import type { Block, Field } from "payload";

const blockFieldLexical = lexicalEditor();

/** Link target sub-fields shared by `button` and `link` groups (keeps the two in sync). */
function linkTargetFields(): Field[] {
  return [
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
  ];
}

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
      ...linkTargetFields(),
    ],
  };
}

/** Bare link target (no label) — binding it to a container/media node makes that element clickable. */
function linkGroupField(spec: BlockFieldSpec): Field {
  return {
    name: spec.name,
    type: "group",
    label: spec.label,
    fields: linkTargetFields(),
  };
}

/**
 * Nested blocks for a `slot` field: the same catalog-generated blocks, minus
 * their own slot fields (`allowSlots: false`) — nesting is one level deep, so
 * config generation cannot recurse.
 */
function slotBlocksField(spec: BlockFieldSpec): Field {
  // Default: leaf blocks only (no slot fields of their own).
  const allowed =
    spec.allowedBlocks !== undefined
      ? BLOCK_CATALOG.filter((entry) =>
          spec.allowedBlocks?.includes(entry.slug),
        )
      : BLOCK_CATALOG.filter(
          (entry) => !entry.fields.some((field) => field.type === "slot"),
        );
  return {
    name: spec.name,
    type: "blocks",
    label: spec.label,
    blocks: allowed.map((entry) =>
      blockFromCatalogEntry(entry, { allowSlots: false }),
    ),
    admin: {
      description: "Blocks rendered inside this design's slot region.",
    },
  };
}

function fieldFromSpec(
  spec: BlockFieldSpec,
  options: { allowSlots: boolean },
): Field | null {
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
    case "link":
      return linkGroupField(spec);
    case "slot":
      return options.allowSlots ? slotBlocksField(spec) : null;
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
        ...(spec.defaultValue !== undefined
          ? { defaultValue: spec.defaultValue }
          : {}),
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

function blockFromCatalogEntry(
  entry: BlockCatalogEntry,
  options: { allowSlots: boolean },
): Block {
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
    fields: [
      designField(entry),
      ...entry.fields
        .map((spec) => fieldFromSpec(spec, options))
        .filter((field): field is Field => field !== null),
    ],
  };
}

/**
 * Native Payload `Block` configs generated from the code-defined block catalog.
 * `allowSlots: false` drops `slot` fields (used for blocks nested inside a
 * slot, capping nesting at one level).
 */
export function blocksFromCatalog(
  options: { allowSlots: boolean } = { allowSlots: true },
): Block[] {
  return BLOCK_CATALOG.map((entry) => blockFromCatalogEntry(entry, options));
}
