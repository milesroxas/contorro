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
  | "link"
  | "slot"
  | "number"
  | "checkbox";

export type BlockFieldSpec = {
  /** camelCase, unique per block; doubles as the Payload field name and binding name. */
  name: string;
  type: BlockFieldType;
  label: string;
  required: boolean;
  /** For `type: "slot"` — block slugs allowed inside. Defaults to leaf blocks (nesting is one level deep). */
  allowedBlocks?: string[];
  /** For `type: "checkbox"` — admin default. Visibility toggles set `true` (visible unless unticked). */
  defaultValue?: boolean;
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
      {
        name: "primaryButton",
        type: "button",
        label: "Primary button",
        required: false,
      },
      {
        name: "secondaryButton",
        type: "button",
        label: "Secondary button",
        required: false,
      },
      { name: "slot", type: "slot", label: "Content slot", required: false },
    ],
  },
  {
    slug: "section",
    label: "Section",
    fields: [
      { name: "eyebrow", type: "text", label: "Eyebrow", required: false },
      { name: "heading", type: "text", label: "Heading", required: true },
      {
        name: "primaryButton",
        type: "button",
        label: "Primary button",
        required: false,
      },
      {
        name: "secondaryButton",
        type: "button",
        label: "Secondary button",
        required: false,
      },
      { name: "slot", type: "slot", label: "Content slot", required: false },
    ],
  },
  {
    slug: "card",
    label: "Card",
    fields: [
      { name: "image", type: "image", label: "Image", required: false },
      { name: "body", type: "richText", label: "Body", required: false },
      { name: "link", type: "link", label: "Card link", required: false },
      { name: "button", type: "button", label: "Button", required: false },
      {
        name: "imageVisible",
        type: "checkbox",
        label: "Show image",
        required: false,
        defaultValue: true,
      },
      {
        name: "bodyVisible",
        type: "checkbox",
        label: "Show body",
        required: false,
        defaultValue: true,
      },
      {
        name: "buttonVisible",
        type: "checkbox",
        label: "Show button",
        required: false,
        defaultValue: true,
      },
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
 * Fields of `entry` usable as visibility toggles (`node.visibilityBinding`):
 * checkbox fields, interpreted as "visible when truthy or unset."
 */
export function visibilityBindableFields(
  entry: BlockCatalogEntry,
): BlockFieldSpec[] {
  return entry.fields.filter((field) => field.type === "checkbox");
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
  // A link wraps a container/media element (clickable card). `primitive.button`
  // is excluded — it carries its own link target.
  link: ["primitive.box", "primitive.section", "primitive.image"],
  slot: ["primitive.slot"],
  number: ["primitive.text"],
  checkbox: ["primitive.text"],
};
