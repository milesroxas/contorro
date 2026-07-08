/**
 * Block catalog — the code-defined content contract for page blocks.
 *
 * Consumed by three surfaces:
 * - payload-config: generates native Payload `Block` configs (typed admin fields),
 * - Studio: binding dropdowns (which composition nodes may bind which field),
 * - renderer: typed value injection into published block designs.
 *
 * Pure data — no Payload imports; adding a block type is a code change + deploy.
 */

export type BlockFieldType =
  | "text"
  | "richText"
  | "image"
  | "button"
  | "number"
  | "checkbox";

export type BlockFieldSpec = {
  /** camelCase, unique per block; doubles as the Payload field name and binding name. */
  name: string;
  type: BlockFieldType;
  label: string;
  required: boolean;
};

export type BlockCatalogEntry = {
  /** Block type slug; also the Payload block slug and `components.blockType` value. */
  slug: string;
  label: string;
  fields: BlockFieldSpec[];
};

export const BLOCK_CATALOG: readonly BlockCatalogEntry[] = [
  {
    slug: "hero",
    label: "Hero",
    fields: [
      { name: "heading", type: "text", label: "Heading", required: true },
      { name: "body", type: "richText", label: "Body", required: false },
      { name: "image", type: "image", label: "Image", required: false },
      { name: "cta", type: "button", label: "CTA", required: false },
    ],
  },
  {
    slug: "feature",
    label: "Feature",
    fields: [
      { name: "heading", type: "text", label: "Heading", required: true },
      { name: "body", type: "richText", label: "Body", required: false },
      { name: "image", type: "image", label: "Image", required: false },
    ],
  },
  {
    slug: "cta",
    label: "Call to action",
    fields: [
      { name: "heading", type: "text", label: "Heading", required: true },
      { name: "body", type: "richText", label: "Body", required: false },
      { name: "button", type: "button", label: "Button", required: true },
    ],
  },
  {
    slug: "content",
    label: "Content",
    fields: [{ name: "body", type: "richText", label: "Body", required: true }],
  },
];

/** Catalog entry for a block type slug, or `null` when unknown. */
export function blockCatalogEntry(slug: string): BlockCatalogEntry | null {
  return BLOCK_CATALOG.find((entry) => entry.slug === slug) ?? null;
}

/**
 * Studio node kinds (composition `definitionKey`s) allowed to bind each block
 * field type. `richText` renders as plain text today (`primitive.text` carries
 * string `content`); number/checkbox render through text content as well.
 */
export const BLOCK_FIELD_BINDABLE_DEFINITION_KEYS: Readonly<
  Record<BlockFieldType, readonly string[]>
> = {
  text: ["primitive.text", "primitive.heading"],
  richText: ["primitive.text"],
  image: ["primitive.image"],
  button: ["primitive.button"],
  number: ["primitive.text"],
  checkbox: ["primitive.text"],
};
