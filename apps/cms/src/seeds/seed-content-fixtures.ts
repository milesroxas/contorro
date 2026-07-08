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

/** Catalog-aligned editor field specs used in seed design bindings. */
const heroBindings = {
  heading: {
    name: "heading",
    type: "text" as const,
    required: true,
    label: "Heading",
  },
  body: {
    name: "body",
    type: "richText" as const,
    required: false,
    label: "Body",
  },
  image: {
    name: "image",
    type: "image" as const,
    required: false,
    label: "Image",
  },
  cta: {
    name: "cta",
    type: "button" as const,
    required: false,
    label: "CTA",
  },
} as const;

const ctaButtonBinding = {
  name: "button",
  type: "button" as const,
  required: true,
  label: "Button",
} as const;

/** Hero block design: binds heading / body / image / cta per the catalog. */
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
      childIds: ["hero-heading", "hero-body", "hero-cta"],
      styleBindingId: "sb-hero-content",
      propValues: {},
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
        { type: "utility", property: "gap", value: "6" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "borderRadius", value: "2xl" },
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
        { type: "utility", property: "gap", value: "4" },
      ],
    },
    "sb-hero-heading": {
      id: "sb-hero-heading",
      nodeId: "hero-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "5xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-hero-body": {
      id: "sb-hero-body",
      nodeId: "hero-body",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-hero-cta": {
      id: "sb-hero-cta",
      nodeId: "hero-cta",
      properties: [
        { type: "utility", property: "display", value: "inline-flex" },
        { type: "utility", property: "justifyContent", value: "center" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "gap", value: "2" },
        { type: "utility", property: "padding", value: "3" },
        { type: "utility", property: "borderRadius", value: "full" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "width", value: "fit" },
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
    "sb-hero-image": {
      id: "sb-hero-image",
      nodeId: "hero-image",
      properties: [
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "aspectRatio", value: "16/9" },
        { type: "utility", property: "borderRadius", value: "xl" },
      ],
    },
  },
} as const;

/** Feature block design: binds heading / body; `image` stays unbound (optional). */
export const seedFeatureDesignComposition = {
  rootId: "feature-root",
  nodes: {
    "feature-root": {
      id: "feature-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["feature-heading", "feature-body"],
      styleBindingId: "sb-feature-root",
      propValues: {},
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
        editorField: {
          name: "heading",
          type: "text" as const,
          required: true,
          label: "Heading",
        },
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
        editorField: {
          name: "body",
          type: "richText" as const,
          required: false,
          label: "Body",
        },
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
        { type: "utility", property: "borderRadius", value: "2xl" },
        { type: "token", property: "background", token: "color.background" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
    "sb-feature-heading": {
      id: "sb-feature-heading",
      nodeId: "feature-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "4xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-feature-body": {
      id: "sb-feature-body",
      nodeId: "feature-body",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
  },
} as const;

/** CTA block design: binds heading / body / button; secondary button is static design. */
export const seedCtaDesignComposition = {
  rootId: "cta-root",
  nodes: {
    "cta-root": {
      id: "cta-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["cta-heading", "cta-body", "cta-actions"],
      styleBindingId: "sb-cta-root",
      propValues: {},
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
        editorField: {
          name: "heading",
          type: "text" as const,
          required: true,
          label: "Heading",
        },
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
        editorField: {
          name: "body",
          type: "richText" as const,
          required: false,
          label: "Body",
        },
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
        { type: "utility", property: "gap", value: "4" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "borderRadius", value: "2xl" },
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
    "sb-cta-heading": {
      id: "sb-cta-heading",
      nodeId: "cta-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "4xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-cta-body": {
      id: "sb-cta-body",
      nodeId: "cta-body",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
      ],
    },
    "sb-cta-actions": {
      id: "sb-cta-actions",
      nodeId: "cta-actions",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "gap", value: "3" },
        { type: "utility", property: "alignItems", value: "center" },
      ],
    },
    "sb-cta-primary-button": {
      id: "sb-cta-primary-button",
      nodeId: "cta-primary-button",
      properties: [
        { type: "utility", property: "display", value: "inline-flex" },
        { type: "utility", property: "justifyContent", value: "center" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "padding", value: "3" },
        { type: "utility", property: "borderRadius", value: "full" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-cta-secondary-button": {
      id: "sb-cta-secondary-button",
      nodeId: "cta-secondary-button",
      properties: [
        { type: "utility", property: "display", value: "inline-flex" },
        { type: "utility", property: "justifyContent", value: "center" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "padding", value: "3" },
        { type: "utility", property: "borderRadius", value: "full" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "token", property: "background", token: "color.secondary" },
        {
          type: "token",
          property: "color",
          token: "color.secondary.foreground",
        },
      ],
    },
  },
} as const;

/** Content block design: binds the required `body` rich text field. */
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
        editorField: {
          name: "body",
          type: "richText" as const,
          required: true,
          label: "Body",
        },
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
        { type: "utility", property: "padding", value: "6" },
      ],
    },
    "sb-content-body": {
      id: "sb-content-body",
      nodeId: "content-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
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
      childIds: ["card-heading", "card-body"],
      styleBindingId: "sb-card-root",
      propValues: {},
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
        { type: "utility", property: "gap", value: "4" },
        { type: "utility", property: "padding", value: "6" },
        { type: "utility", property: "borderRadius", value: "xl" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-card-heading": {
      id: "sb-card-heading",
      nodeId: "card-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "2xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
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
        { type: "utility", property: "display", value: "inline-flex" },
        { type: "utility", property: "justifyContent", value: "center" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "gap", value: "2" },
        { type: "utility", property: "padding", value: "3" },
        { type: "utility", property: "borderRadius", value: "full" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "token", property: "background", token: "color.primary" },
        { type: "token", property: "color", token: "color.primary.foreground" },
      ],
    },
  },
} as const;

/**
 * Design-only page template aligned with `defaultPageTemplateComposition()`
 * (header / main+slot / footer) plus a static hero section. Templates carry
 * no CMS-editable fields — page content lives in native blocks.
 */
export function buildSeedPageTemplateComposition(): PageComposition {
  const base = defaultPageTemplateComposition();

  const nodes: PageComposition["nodes"] = {
    ...base.nodes,
    "page-header": {
      ...base.nodes["page-header"],
      childIds: ["page-header-brand", "page-header-nav"],
      styleBindingId: "sb-page-header",
    },
    "page-header-brand": {
      id: "page-header-brand",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-header",
      childIds: [],
      styleBindingId: "sb-page-header-brand",
      propValues: { content: "Contorro" },
    },
    "page-header-nav": {
      id: "page-header-nav",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-header",
      childIds: [],
      styleBindingId: "sb-page-header-nav",
      propValues: { content: "Product · Solutions · Pricing · Contact" },
    },
    "page-main": {
      ...base.nodes["page-main"],
      childIds: ["page-hero-section", "page-main-slot"],
      styleBindingId: "sb-page-main",
    },
    "page-hero-section": {
      id: "page-hero-section",
      kind: "primitive",
      definitionKey: "primitive.section",
      parentId: "page-main",
      childIds: ["page-hero-heading", "page-hero-subhead"],
      styleBindingId: "sb-page-hero-section",
      propValues: {},
    },
    "page-hero-heading": {
      id: "page-hero-heading",
      kind: "primitive",
      definitionKey: "primitive.heading",
      parentId: "page-hero-section",
      childIds: [],
      styleBindingId: "sb-page-hero-heading",
      propValues: {
        content: "Seed template hero — authored in Studio",
        level: "h1",
      },
    },
    "page-hero-subhead": {
      id: "page-hero-subhead",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-hero-section",
      childIds: [],
      styleBindingId: "sb-page-hero-subhead",
      propValues: {
        content:
          "Templates are design-only; page content lives in blocks below.",
      },
    },
    "page-footer": {
      ...base.nodes["page-footer"],
      childIds: ["page-footer-note"],
      styleBindingId: "sb-page-footer",
    },
    "page-footer-note": {
      id: "page-footer-note",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-footer",
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
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "justifyContent", value: "between" },
        { type: "utility", property: "alignItems", value: "center" },
        { type: "utility", property: "padding", value: "6" },
      ],
    },
    "sb-page-header-brand": {
      id: "sb-page-header-brand",
      nodeId: "page-header-brand",
      properties: [
        { type: "utility", property: "fontSize", value: "xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
      ],
    },
    "sb-page-header-nav": {
      id: "sb-page-header-nav",
      nodeId: "page-header-nav",
      properties: [{ type: "utility", property: "fontSize", value: "sm" }],
    },
    "sb-page-main": {
      id: "sb-page-main",
      nodeId: "page-main",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "8" },
        { type: "utility", property: "padding", value: "6" },
        { type: "utility", property: "minHeight", value: "screen" },
        { type: "token", property: "background", token: "color.background" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
    "sb-page-hero-section": {
      id: "sb-page-hero-section",
      nodeId: "page-hero-section",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "4" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "borderRadius", value: "xl" },
        { type: "token", property: "background", token: "color.card" },
      ],
    },
    "sb-page-hero-heading": {
      id: "sb-page-hero-heading",
      nodeId: "page-hero-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "4xl" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-page-hero-subhead": {
      id: "sb-page-hero-subhead",
      nodeId: "page-hero-subhead",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
      ],
    },
    "sb-page-footer": {
      id: "sb-page-footer",
      nodeId: "page-footer",
      properties: [{ type: "utility", property: "padding", value: "6" }],
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
 * `primitive.libraryComponent` refs (highlight card + primary button) between
 * the hero and the `main` layout slot. Embedded refs carry no instance values.
 */
export function buildSeedPageTemplateWithLibraryComposition(): PageComposition {
  const base = buildSeedPageTemplateComposition();
  const pageMain = base.nodes["page-main"];
  if (!pageMain) {
    throw new Error("buildSeedPageTemplateComposition: missing page-main");
  }

  const slotIdx = pageMain.childIds.indexOf("page-main-slot");
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
      parentId: "page-main",
      childIds: [],
      propValues: { componentKey: SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY },
    },
    [PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-main",
      childIds: [],
      propValues: { componentKey: SEED_PRIMARY_BUTTON_COMPONENT_KEY },
    },
    "page-main": {
      ...pageMain,
      childIds:
        slotIdx === -1
          ? [...pageMain.childIds, ...libraryEmbedIds]
          : [
              ...pageMain.childIds.slice(0, slotIdx),
              ...libraryEmbedIds,
              ...pageMain.childIds.slice(slotIdx),
            ],
    },
  };

  return PageCompositionSchema.parse({
    rootId: base.rootId,
    nodes: withRef,
    styleBindings: base.styleBindings,
  });
}
