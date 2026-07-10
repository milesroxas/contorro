import {
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import { defaultPageTemplateComposition } from "@repo/domains-composition";

/**
 * Seed fixtures for the blocks content model:
 * - Block designs (`components` with `blockType`) whose compositions bind
 *   catalog field names via `contentBinding.source === "editor"`.
 * - Design-only library parts (no `blockType`, no editor bindings) used as
 *   embedded refs inside page templates.
 * - Design-only page templates (header / hero / main slot / footer).
 *
 * Styling intent: a warm, editorial system driven entirely by design tokens.
 * Sections are token-tinted cards with hairline borders, generous responsive
 * padding, a constrained content measure, and a tracked uppercase eyebrow —
 * a deliberate look rather than a stack of full-bleed default boxes.
 */

export const SEED_HERO_DESIGN_COMPONENT_KEY = "seed-hero-design";
export const SEED_FEATURE_DESIGN_COMPONENT_KEY = "seed-feature-design";
export const SEED_CTA_DESIGN_COMPONENT_KEY = "seed-cta-design";
export const SEED_CONTENT_DESIGN_COMPONENT_KEY = "seed-content-design";
/** Design-only library part embedded in the “with library” template. */
export const SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY = "seed-content-highlight";
export const SEED_PRIMARY_BUTTON_COMPONENT_KEY = "seed-primary-button";

type LexicalChildNode = {
  [k: string]: unknown;
  type: string;
  version: number;
};

/** Minimal Payload Lexical editor state carrying one paragraph of plain text. */
export function lexicalRichText(text: string): {
  root: {
    type: string;
    children: LexicalChildNode[];
    direction: "ltr";
    format: "";
    indent: number;
    version: number;
  };
} {
  return {
    root: {
      type: "root",
      direction: "ltr",
      format: "",
      indent: 0,
      version: 1,
      children: [
        {
          type: "paragraph",
          direction: "ltr",
          format: "",
          indent: 0,
          version: 1,
          textFormat: 0,
          textStyle: "",
          children: [
            {
              type: "text",
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text,
              version: 1,
            },
          ],
        },
      ],
    },
  };
}

/**
 * Shared style fragments — one definition per repeated visual pattern so the
 * seed reads as a system, not a pile of one-off overrides.
 */

/** Hairline border tied to the theme border token (needs an explicit width/style). */
const HAIRLINE_BORDER = [
  { type: "utility", property: "borderWidth", value: "DEFAULT" },
  { type: "utility", property: "borderStyle", value: "solid" },
  { type: "token", property: "borderColor", token: "color.border" },
] as const;

/** Tracked, uppercase kicker above a heading. Pair with a color token per section. */
const EYEBROW_TYPE = [
  { type: "utility", property: "fontSize", value: "xs" },
  { type: "utility", property: "fontWeight", value: "semibold" },
  { type: "utility", property: "textTransform", value: "uppercase" },
  { type: "utility", property: "letterSpacing", value: "widest" },
] as const;

/** Pill button geometry. Pair with background/color tokens per usage. */
const PILL_BUTTON = [
  { type: "utility", property: "display", value: "inline-flex" },
  { type: "utility", property: "justifyContent", value: "center" },
  { type: "utility", property: "alignItems", value: "center" },
  { type: "utility", property: "gap", value: "2" },
  { type: "utility", property: "paddingTop", value: "3" },
  { type: "utility", property: "paddingBottom", value: "3" },
  { type: "utility", property: "paddingLeft", value: "6" },
  { type: "utility", property: "paddingRight", value: "6" },
  { type: "utility", property: "borderRadius", value: "full" },
  { type: "utility", property: "fontSize", value: "sm" },
  { type: "utility", property: "fontWeight", value: "semibold" },
  { type: "utility", property: "width", value: "fit" },
] as const;

/** Catalog field bindings used in seed designs (names only — the catalog owns types/labels). */
const heroBindings = {
  heading: { name: "heading" },
  body: { name: "body" },
  image: { name: "image" },
  cta: { name: "cta" },
} as const;

const ctaButtonBinding = { name: "button" } as const;

/**
 * Hero block design: binds heading / body / image / cta per the catalog.
 * Layout: eyebrow + copy column beside a framed media panel — stacks on
 * mobile, becomes a two-column split from `lg`.
 */
export const seedHeroDesignComposition = {
  rootId: "hero-root",
  nodes: {
    "hero-root": {
      id: "hero-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["hero-content", "hero-image"],
      styleBindingId: "sb-hero-root",
      propValues: {},
    },
    "hero-content": {
      id: "hero-content",
      kind: "primitive" as const,
      definitionKey: "primitive.section",
      parentId: "hero-root",
      childIds: ["hero-eyebrow", "hero-heading", "hero-body", "hero-cta"],
      styleBindingId: "sb-hero-content",
      propValues: {},
    },
    "hero-eyebrow": {
      id: "hero-eyebrow",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "hero-content",
      childIds: [],
      styleBindingId: "sb-hero-eyebrow",
      propValues: { content: "Design system starter" },
    },
    "hero-heading": {
      id: "hero-heading",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "hero-content",
      childIds: [],
      styleBindingId: "sb-hero-heading",
      propValues: {
        content: "Launch pages faster with reusable blocks",
        level: "h1",
      },
      contentBinding: {
        source: "editor" as const,
        key: "heading",
        editorField: heroBindings.heading,
      },
    },
    "hero-body": {
      id: "hero-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "hero-content",
      childIds: [],
      styleBindingId: "sb-hero-body",
      propValues: {
        content: "Hero design body copy — replaced by the page block value.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "body",
        editorField: heroBindings.body,
      },
    },
    "hero-cta": {
      id: "hero-cta",
      kind: "primitive" as const,
      definitionKey: "primitive.button",
      parentId: "hero-content",
      childIds: [],
      styleBindingId: "sb-hero-cta",
      propValues: {
        label: "Start designing",
        linkType: "url",
        href: "/studio",
        collectionSlug: "",
        entrySlug: "",
        openInNewTab: false,
      },
      contentBinding: {
        source: "editor" as const,
        key: "cta",
        editorField: heroBindings.cta,
      },
    },
    "hero-image": {
      id: "hero-image",
      kind: "primitive" as const,
      definitionKey: "primitive.image",
      parentId: "hero-root",
      childIds: [],
      styleBindingId: "sb-hero-image",
      propValues: {
        src: "",
        alt: "Hero image",
        imageSource: "media",
        imageUtilities: "object-cover",
        mediaId: "",
        mediaUrl: "",
      },
      contentBinding: {
        source: "editor" as const,
        key: "image",
        editorField: heroBindings.image,
      },
    },
  },
  styleBindings: {
    "sb-hero-root": {
      id: "sb-hero-root",
      nodeId: "hero-root",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "flexDirection", value: "row", breakpoint: "lg" },
        { type: "utility", property: "alignItems", value: "start" },
        { type: "utility", property: "alignItems", value: "center", breakpoint: "lg" },
        { type: "utility", property: "gap", value: "8" },
        { type: "utility", property: "gap", value: "12", breakpoint: "lg" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "padding", value: "12", breakpoint: "md" },
        { type: "utility", property: "padding", value: "16", breakpoint: "lg" },
        { type: "utility", property: "borderRadius", value: "3xl" },
        { type: "utility", property: "overflow", value: "hidden" },
        ...HAIRLINE_BORDER,
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-hero-content": {
      id: "sb-hero-content",
      nodeId: "hero-content",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "alignItems", value: "start" },
        { type: "utility", property: "gap", value: "5" },
        { type: "utility", property: "flex", value: "1" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "maxWidth", value: "2xl" },
        { type: "utility", property: "textAlign", value: "left" },
      ],
    },
    "sb-hero-eyebrow": {
      id: "sb-hero-eyebrow",
      nodeId: "hero-eyebrow",
      properties: [
        ...EYEBROW_TYPE,
        { type: "token", property: "color", token: "color.primary" },
      ],
    },
    "sb-hero-heading": {
      id: "sb-hero-heading",
      nodeId: "hero-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "4xl" },
        { type: "utility", property: "fontSize", value: "5xl", breakpoint: "md" },
        { type: "utility", property: "fontSize", value: "6xl", breakpoint: "lg" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
        { type: "utility", property: "letterSpacing", value: "tight" },
      ],
    },
    "sb-hero-body": {
      id: "sb-hero-body",
      nodeId: "hero-body",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "fontSize", value: "xl", breakpoint: "md" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-hero-cta": {
      id: "sb-hero-cta",
      nodeId: "hero-cta",
      properties: [
        ...PILL_BUTTON,
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
    "sb-hero-image": {
      id: "sb-hero-image",
      nodeId: "hero-image",
      properties: [
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "width", value: "1/2", breakpoint: "lg" },
        { type: "utility", property: "flexShrink", value: "0" },
        { type: "utility", property: "aspectRatio", value: "video" },
        { type: "utility", property: "borderRadius", value: "2xl" },
        { type: "utility", property: "overflow", value: "hidden" },
        ...HAIRLINE_BORDER,
      ],
    },
  },
} as const;

/**
 * Feature block design: binds heading / body; `image` stays unbound (optional).
 * A calm bordered panel led by an accent-tinted eyebrow.
 */
export const seedFeatureDesignComposition = {
  rootId: "feature-root",
  nodes: {
    "feature-root": {
      id: "feature-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["feature-eyebrow", "feature-heading", "feature-body"],
      styleBindingId: "sb-feature-root",
      propValues: {},
    },
    "feature-eyebrow": {
      id: "feature-eyebrow",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "feature-root",
      childIds: [],
      styleBindingId: "sb-feature-eyebrow",
      propValues: { content: "Capabilities" },
    },
    "feature-heading": {
      id: "feature-heading",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "feature-root",
      childIds: [],
      styleBindingId: "sb-feature-heading",
      propValues: {
        content: "Everything your website launch needs",
        level: "h2",
      },
      contentBinding: {
        source: "editor" as const,
        key: "heading",
        editorField: { name: "heading" },
      },
    },
    "feature-body": {
      id: "feature-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "feature-root",
      childIds: [],
      styleBindingId: "sb-feature-body",
      propValues: {
        content: "Feature design body copy — replaced by the page block value.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "body",
        editorField: { name: "body" },
      },
    },
  },
  styleBindings: {
    "sb-feature-root": {
      id: "sb-feature-root",
      nodeId: "feature-root",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "4" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "padding", value: "10", breakpoint: "md" },
        { type: "utility", property: "borderRadius", value: "2xl" },
        ...HAIRLINE_BORDER,
        { type: "token", property: "background", token: "color.background" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
    "sb-feature-eyebrow": {
      id: "sb-feature-eyebrow",
      nodeId: "feature-eyebrow",
      properties: [
        ...EYEBROW_TYPE,
        { type: "token", property: "color", token: "color.accent.foreground" },
      ],
    },
    "sb-feature-heading": {
      id: "sb-feature-heading",
      nodeId: "feature-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "3xl" },
        { type: "utility", property: "fontSize", value: "4xl", breakpoint: "md" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
        { type: "utility", property: "letterSpacing", value: "tight" },
      ],
    },
    "sb-feature-body": {
      id: "sb-feature-body",
      nodeId: "feature-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "fontSize", value: "lg", breakpoint: "md" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "utility", property: "maxWidth", value: "2xl" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
  },
} as const;

/**
 * CTA block design: binds heading / body / button; secondary button is static
 * design. A centered, high-contrast primary panel closing a page.
 */
export const seedCtaDesignComposition = {
  rootId: "cta-root",
  nodes: {
    "cta-root": {
      id: "cta-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["cta-eyebrow", "cta-heading", "cta-body", "cta-actions"],
      styleBindingId: "sb-cta-root",
      propValues: {},
    },
    "cta-eyebrow": {
      id: "cta-eyebrow",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "cta-root",
      childIds: [],
      styleBindingId: "sb-cta-eyebrow",
      propValues: { content: "Ready when you are" },
    },
    "cta-heading": {
      id: "cta-heading",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "cta-root",
      childIds: [],
      styleBindingId: "sb-cta-heading",
      propValues: { content: "Ready to ship your next page?", level: "h2" },
      contentBinding: {
        source: "editor" as const,
        key: "heading",
        editorField: { name: "heading" },
      },
    },
    "cta-body": {
      id: "cta-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "cta-root",
      childIds: [],
      styleBindingId: "sb-cta-body",
      propValues: {
        content:
          "Use this section near the bottom of a page to drive conversions.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "body",
        editorField: { name: "body" },
      },
    },
    "cta-actions": {
      id: "cta-actions",
      kind: "primitive" as const,
      definitionKey: "primitive.section",
      parentId: "cta-root",
      childIds: ["cta-primary-button", "cta-secondary-button"],
      styleBindingId: "sb-cta-actions",
      propValues: {},
    },
    "cta-primary-button": {
      id: "cta-primary-button",
      kind: "primitive" as const,
      definitionKey: "primitive.button",
      parentId: "cta-actions",
      childIds: [],
      styleBindingId: "sb-cta-primary-button",
      propValues: {
        label: "Book a demo",
        linkType: "url",
        href: "/contact",
        collectionSlug: "",
        entrySlug: "",
        openInNewTab: false,
      },
      contentBinding: {
        source: "editor" as const,
        key: "button",
        editorField: ctaButtonBinding,
      },
    },
    "cta-secondary-button": {
      id: "cta-secondary-button",
      kind: "primitive" as const,
      definitionKey: "primitive.button",
      parentId: "cta-actions",
      childIds: [],
      styleBindingId: "sb-cta-secondary-button",
      propValues: {
        label: "View pricing",
        linkType: "url",
        href: "/pricing",
        collectionSlug: "",
        entrySlug: "",
        openInNewTab: false,
      },
    },
  },
  styleBindings: {
    "sb-cta-root": {
      id: "sb-cta-root",
      nodeId: "cta-root",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "textAlign", value: "center" },
        { type: "utility", property: "gap", value: "6" },
        { type: "utility", property: "padding", value: "10" },
        { type: "utility", property: "padding", value: "16", breakpoint: "md" },
        { type: "utility", property: "borderRadius", value: "3xl" },
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
    "sb-cta-eyebrow": {
      id: "sb-cta-eyebrow",
      nodeId: "cta-eyebrow",
      properties: [
        ...EYEBROW_TYPE,
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
    "sb-cta-heading": {
      id: "sb-cta-heading",
      nodeId: "cta-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "3xl" },
        { type: "utility", property: "fontSize", value: "5xl", breakpoint: "md" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
        { type: "utility", property: "letterSpacing", value: "tight" },
        { type: "utility", property: "maxWidth", value: "3xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
      ],
    },
    "sb-cta-body": {
      id: "sb-cta-body",
      nodeId: "cta-body",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "utility", property: "maxWidth", value: "2xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
      ],
    },
    "sb-cta-actions": {
      id: "sb-cta-actions",
      nodeId: "cta-actions",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexWrap", value: "wrap" },
        { type: "utility", property: "justifyContent", value: "center" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "gap", value: "3" },
      ],
    },
    "sb-cta-primary-button": {
      id: "sb-cta-primary-button",
      nodeId: "cta-primary-button",
      properties: [
        ...PILL_BUTTON,
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-cta-secondary-button": {
      id: "sb-cta-secondary-button",
      nodeId: "cta-secondary-button",
      properties: [
        ...PILL_BUTTON,
        { type: "utility", property: "borderWidth", value: "DEFAULT" },
        { type: "utility", property: "borderStyle", value: "solid" },
        { type: "utility", property: "borderColor", value: "white" },
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
  },
} as const;

/**
 * Content block design: binds the required `body` rich text field.
 * Centered prose measure for comfortable long-form reading.
 */
export const seedContentDesignComposition = {
  rootId: "content-root",
  nodes: {
    "content-root": {
      id: "content-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["content-body"],
      styleBindingId: "sb-content-root",
      propValues: {},
    },
    "content-body": {
      id: "content-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "content-root",
      childIds: [],
      styleBindingId: "sb-content-body",
      propValues: {
        content: "Content design body — replaced by the page block value.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "body",
        editorField: { name: "body" },
      },
    },
  },
  styleBindings: {
    "sb-content-root": {
      id: "sb-content-root",
      nodeId: "content-root",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "4" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "maxWidth", value: "prose" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
      ],
    },
    "sb-content-body": {
      id: "sb-content-body",
      nodeId: "content-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "fontSize", value: "lg", breakpoint: "md" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
  },
} as const;

/**
 * Design-only library card (no `blockType`, no editor bindings) — used as an
 * embedded `primitive.libraryComponent` ref in the “with library” template.
 */
export const seedContentHighlightComposition = {
  rootId: "card-root",
  nodes: {
    "card-root": {
      id: "card-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["card-eyebrow", "card-heading", "card-body"],
      styleBindingId: "sb-card-root",
      propValues: {},
    },
    "card-eyebrow": {
      id: "card-eyebrow",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "card-root",
      childIds: [],
      styleBindingId: "sb-card-eyebrow",
      propValues: { content: "Library part" },
    },
    "card-heading": {
      id: "card-heading",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "card-root",
      childIds: [],
      styleBindingId: "sb-card-heading",
      propValues: {
        content: "Design faster with reusable sections",
        level: "h2",
      },
    },
    "card-body": {
      id: "card-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "card-root",
      childIds: [],
      styleBindingId: "sb-card-body",
      propValues: {
        content:
          "Seeded design-only library card. Embedded refs render their authored content as-is.",
      },
    },
  },
  styleBindings: {
    "sb-card-root": {
      id: "sb-card-root",
      nodeId: "card-root",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "3" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "borderRadius", value: "2xl" },
        ...HAIRLINE_BORDER,
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-card-eyebrow": {
      id: "sb-card-eyebrow",
      nodeId: "card-eyebrow",
      properties: [
        ...EYEBROW_TYPE,
        { type: "token", property: "color", token: "color.primary" },
      ],
    },
    "sb-card-heading": {
      id: "sb-card-heading",
      nodeId: "card-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "2xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
        { type: "utility", property: "letterSpacing", value: "tight" },
      ],
    },
    "sb-card-body": {
      id: "sb-card-body",
      nodeId: "card-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
  },
} as const;

/** Design-only styled button part (no editor bindings). */
export const seedPrimaryButtonComposition = {
  rootId: "seed-button-root",
  nodes: {
    "seed-button-root": {
      id: "seed-button-root",
      kind: "primitive" as const,
      definitionKey: "primitive.button" as const,
      parentId: null,
      childIds: [],
      styleBindingId: "sb-seed-button-root",
      propValues: {
        label: "Get started",
        linkType: "url",
        href: "/contact",
        collectionSlug: "",
        entrySlug: "",
        openInNewTab: false,
      },
    },
  },
  styleBindings: {
    "sb-seed-button-root": {
      id: "sb-seed-button-root",
      nodeId: "seed-button-root",
      properties: [
        ...PILL_BUTTON,
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
  },
} as const;

/**
 * Design-only page template aligned with `defaultPageTemplateComposition()`
 * (header / main+slot / footer). Templates carry no CMS-editable fields — page
 * content lives in native blocks rendered into the `main` slot.
 *
 * Layout conventions:
 * - Full-bleed token-tinted header/footer bands, each with a centered inner
 *   row capped to a `6xl` measure and consistent gutter padding.
 * - A full-bleed hero masthead (centered `5xl` measure, responsive type scale).
 * - A centered `6xl` content column that wraps the block slot with even
 *   vertical rhythm between blocks.
 */
export function buildSeedPageTemplateComposition(): PageComposition {
  const base = defaultPageTemplateComposition();

  const nodes: PageComposition["nodes"] = {
    ...base.nodes,
    "page-header": {
      ...base.nodes["page-header"],
      childIds: ["page-header-inner"],
      styleBindingId: "sb-page-header",
    },
    "page-header-inner": {
      id: "page-header-inner",
      kind: "primitive",
      definitionKey: "primitive.box",
      parentId: "page-header",
      childIds: ["page-header-brand", "page-header-nav"],
      styleBindingId: "sb-page-header-inner",
      propValues: { tag: "div" },
    },
    "page-header-brand": {
      id: "page-header-brand",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-header-inner",
      childIds: [],
      styleBindingId: "sb-page-header-brand",
      propValues: { content: "Contorro" },
    },
    "page-header-nav": {
      id: "page-header-nav",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-header-inner",
      childIds: [],
      styleBindingId: "sb-page-header-nav",
      propValues: { content: "Product · Solutions · Pricing · Contact" },
    },
    "page-main": {
      ...base.nodes["page-main"],
      childIds: ["page-hero-section", "page-content"],
      styleBindingId: "sb-page-main",
    },
    "page-hero-section": {
      id: "page-hero-section",
      kind: "primitive",
      definitionKey: "primitive.section",
      parentId: "page-main",
      childIds: ["page-hero-inner"],
      styleBindingId: "sb-page-hero-section",
      propValues: {},
    },
    "page-hero-inner": {
      id: "page-hero-inner",
      kind: "primitive",
      definitionKey: "primitive.box",
      parentId: "page-hero-section",
      childIds: [
        "page-hero-eyebrow",
        "page-hero-heading",
        "page-hero-subhead",
      ],
      styleBindingId: "sb-page-hero-inner",
      propValues: { tag: "div" },
    },
    "page-hero-eyebrow": {
      id: "page-hero-eyebrow",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-hero-inner",
      childIds: [],
      styleBindingId: "sb-page-hero-eyebrow",
      propValues: { content: "Build · Compose · Publish" },
    },
    "page-hero-heading": {
      id: "page-hero-heading",
      kind: "primitive",
      definitionKey: "primitive.heading",
      parentId: "page-hero-inner",
      childIds: [],
      styleBindingId: "sb-page-hero-heading",
      propValues: {
        content: "A design system your whole team can build on",
        level: "h1",
      },
    },
    "page-hero-subhead": {
      id: "page-hero-subhead",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-hero-inner",
      childIds: [],
      styleBindingId: "sb-page-hero-subhead",
      propValues: {
        content:
          "This masthead lives in the template. Page content is composed from typed blocks in the column below.",
      },
    },
    "page-content": {
      id: "page-content",
      kind: "primitive",
      definitionKey: "primitive.box",
      parentId: "page-main",
      childIds: ["page-main-slot"],
      styleBindingId: "sb-page-content",
      propValues: { tag: "div" },
    },
    "page-main-slot": {
      ...base.nodes["page-main-slot"],
      parentId: "page-content",
    },
    "page-footer": {
      ...base.nodes["page-footer"],
      childIds: ["page-footer-inner"],
      styleBindingId: "sb-page-footer",
    },
    "page-footer-inner": {
      id: "page-footer-inner",
      kind: "primitive",
      definitionKey: "primitive.box",
      parentId: "page-footer",
      childIds: ["page-footer-brand", "page-footer-note"],
      styleBindingId: "sb-page-footer-inner",
      propValues: { tag: "div" },
    },
    "page-footer-brand": {
      id: "page-footer-brand",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-footer-inner",
      childIds: [],
      styleBindingId: "sb-page-footer-brand",
      propValues: { content: "Contorro" },
    },
    "page-footer-note": {
      id: "page-footer-note",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-footer-inner",
      childIds: [],
      styleBindingId: "sb-page-footer-note",
      propValues: {
        content: "© Seed starter · Replace with your site footer content.",
      },
    },
  };

  const styleBindings: PageComposition["styleBindings"] = {
    ...base.styleBindings,
    "sb-page-header": {
      id: "sb-page-header",
      nodeId: "page-header",
      properties: [
        { type: "utility", property: "width", value: "full" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-page-header-inner": {
      id: "sb-page-header-inner",
      nodeId: "page-header-inner",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "justifyContent", value: "between" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "gap", value: "4" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "maxWidth", value: "6xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
        { type: "utility", property: "paddingLeft", value: "6" },
        { type: "utility", property: "paddingRight", value: "6" },
        { type: "utility", property: "paddingLeft", value: "8", breakpoint: "md" },
        { type: "utility", property: "paddingRight", value: "8", breakpoint: "md" },
        { type: "utility", property: "paddingTop", value: "5" },
        { type: "utility", property: "paddingBottom", value: "5" },
      ],
    },
    "sb-page-header-brand": {
      id: "sb-page-header-brand",
      nodeId: "page-header-brand",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "letterSpacing", value: "tight" },
      ],
    },
    "sb-page-header-nav": {
      id: "sb-page-header-nav",
      nodeId: "page-header-nav",
      properties: [
        { type: "utility", property: "fontSize", value: "sm" },
        { type: "utility", property: "letterSpacing", value: "wide" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-page-main": {
      id: "sb-page-main",
      nodeId: "page-main",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "minHeight", value: "screen" },
        { type: "token", property: "background", token: "color.background" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
    "sb-page-hero-section": {
      id: "sb-page-hero-section",
      nodeId: "page-hero-section",
      properties: [
        { type: "utility", property: "paddingLeft", value: "6" },
        { type: "utility", property: "paddingRight", value: "6" },
        { type: "utility", property: "paddingTop", value: "16" },
        { type: "utility", property: "paddingBottom", value: "16" },
        { type: "utility", property: "paddingTop", value: "24", breakpoint: "md" },
        { type: "utility", property: "paddingBottom", value: "24", breakpoint: "md" },
      ],
    },
    "sb-page-hero-inner": {
      id: "sb-page-hero-inner",
      nodeId: "page-hero-inner",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "textAlign", value: "center" },
        { type: "utility", property: "gap", value: "6" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "maxWidth", value: "5xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
      ],
    },
    "sb-page-hero-eyebrow": {
      id: "sb-page-hero-eyebrow",
      nodeId: "page-hero-eyebrow",
      properties: [
        ...EYEBROW_TYPE,
        { type: "token", property: "color", token: "color.primary" },
      ],
    },
    "sb-page-hero-heading": {
      id: "sb-page-hero-heading",
      nodeId: "page-hero-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "5xl" },
        { type: "utility", property: "fontSize", value: "6xl", breakpoint: "md" },
        { type: "utility", property: "fontSize", value: "7xl", breakpoint: "lg" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
        { type: "utility", property: "letterSpacing", value: "tight" },
      ],
    },
    "sb-page-hero-subhead": {
      id: "sb-page-hero-subhead",
      nodeId: "page-hero-subhead",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "fontSize", value: "xl", breakpoint: "md" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "utility", property: "maxWidth", value: "2xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-page-content": {
      id: "sb-page-content",
      nodeId: "page-content",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "10" },
        { type: "utility", property: "gap", value: "12", breakpoint: "md" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "maxWidth", value: "6xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
        { type: "utility", property: "paddingLeft", value: "6" },
        { type: "utility", property: "paddingRight", value: "6" },
        { type: "utility", property: "paddingLeft", value: "8", breakpoint: "md" },
        { type: "utility", property: "paddingRight", value: "8", breakpoint: "md" },
        { type: "utility", property: "paddingBottom", value: "20" },
        { type: "utility", property: "paddingBottom", value: "24", breakpoint: "md" },
      ],
    },
    "sb-page-footer": {
      id: "sb-page-footer",
      nodeId: "page-footer",
      properties: [
        { type: "utility", property: "width", value: "full" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-page-footer-inner": {
      id: "sb-page-footer-inner",
      nodeId: "page-footer-inner",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "flexDirection", value: "row", breakpoint: "md" },
        { type: "utility", property: "justifyContent", value: "between", breakpoint: "md" },
        { type: "utility", property: "alignItems", value: "center", breakpoint: "md" },
        { type: "utility", property: "gap", value: "3" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "maxWidth", value: "6xl" },
        { type: "utility", property: "marginLeft", value: "auto" },
        { type: "utility", property: "marginRight", value: "auto" },
        { type: "utility", property: "paddingLeft", value: "6" },
        { type: "utility", property: "paddingRight", value: "6" },
        { type: "utility", property: "paddingLeft", value: "8", breakpoint: "md" },
        { type: "utility", property: "paddingRight", value: "8", breakpoint: "md" },
        { type: "utility", property: "paddingTop", value: "10" },
        { type: "utility", property: "paddingBottom", value: "10" },
      ],
    },
    "sb-page-footer-brand": {
      id: "sb-page-footer-brand",
      nodeId: "page-footer-brand",
      properties: [
        { type: "utility", property: "fontSize", value: "sm" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
    "sb-page-footer-note": {
      id: "sb-page-footer-note",
      nodeId: "page-footer-note",
      properties: [
        { type: "utility", property: "fontSize", value: "sm" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
  };

  return PageCompositionSchema.parse({
    rootId: base.rootId,
    nodes,
    styleBindings,
  });
}

/** Library embed node ids in {@link buildSeedPageTemplateWithLibraryComposition}. */
export const PAGE_MAIN_EMBED_LIBRARY_ID = "page-main-embed-highlight";
export const PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID =
  "page-main-embed-primary-button";

/**
 * Same as {@link buildSeedPageTemplateComposition}, plus design-only
 * `primitive.libraryComponent` refs (highlight card + primary button) placed at
 * the top of the centered content column, before the block slot. Embedded refs
 * carry no instance values.
 */
export function buildSeedPageTemplateWithLibraryComposition(): PageComposition {
  const base = buildSeedPageTemplateComposition();
  const pageContent = base.nodes["page-content"];
  if (!pageContent) {
    throw new Error(
      "buildSeedPageTemplateComposition: missing page-content wrapper",
    );
  }

  const slotIdx = pageContent.childIds.indexOf("page-main-slot");
  const libraryEmbedIds = [
    PAGE_MAIN_EMBED_LIBRARY_ID,
    PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID,
  ] as const;
  const withRef: PageComposition["nodes"] = {
    ...base.nodes,
    [PAGE_MAIN_EMBED_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-content",
      childIds: [],
      propValues: { componentKey: SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY },
    },
    [PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-content",
      childIds: [],
      propValues: { componentKey: SEED_PRIMARY_BUTTON_COMPONENT_KEY },
    },
    "page-content": {
      ...pageContent,
      childIds:
        slotIdx === -1
          ? [...pageContent.childIds, ...libraryEmbedIds]
          : [
              ...pageContent.childIds.slice(0, slotIdx),
              ...libraryEmbedIds,
              ...pageContent.childIds.slice(slotIdx),
            ],
    },
  };

  return PageCompositionSchema.parse({
    rootId: base.rootId,
    nodes: withRef,
    styleBindings: base.styleBindings,
  });
}
