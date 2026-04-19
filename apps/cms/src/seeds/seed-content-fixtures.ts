import {
  type PageComposition,
  PageCompositionSchema,
} from "@repo/contracts-zod";
import { defaultPageTemplateComposition } from "@repo/domains-composition";

const DEFAULT_HERO_HEADLINE_DESCRIPTION =
  "Filled via Pages → Template CMS fields (maps to this page template).";

/** Payload `components.key` for the seeded “Seed content highlight” library block. */
export const SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY = "seed-content-highlight";
export const SEED_PRIMARY_BUTTON_COMPONENT_KEY = "seed-primary-button";
export const SEED_HERO_SECTION_COMPONENT_KEY = "seed-hero-section";
export const SEED_FEATURE_GRID_SECTION_COMPONENT_KEY =
  "seed-feature-grid-section";
export const SEED_CTA_SECTION_COMPONENT_KEY = "seed-cta-section";

const highlightHeadlineField = {
  name: "headline",
  type: "text" as const,
  required: true,
  label: "Headline",
} as const;

const highlightBodyField = {
  name: "body",
  type: "text" as const,
  required: false,
  label: "Body",
} as const;

const highlightImageField = {
  name: "image",
  type: "image" as const,
  required: false,
  label: "Image",
} as const;

/**
 * Shared “headline” designer block: CMS `editorFields` + matching `composition` /
 * `contentBinding` (used by main seed and E2E helpers). Root is a `section` so
 * the block reads as a content region, not a bare box.
 */
export const headlineCardEditorFields = {
  editorFields: [
    highlightHeadlineField,
    highlightBodyField,
    highlightImageField,
  ],
} as const;

export const headlineCardComposition = {
  rootId: "card-root",
  nodes: {
    "card-root": {
      id: "card-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["card-image", "card-heading", "card-body"],
      styleBindingId: "sb-card-root",
      propValues: {},
    },
    "card-image": {
      id: "card-image",
      kind: "primitive" as const,
      definitionKey: "primitive.image",
      parentId: "card-root",
      childIds: [],
      styleBindingId: "sb-card-image",
      propValues: {
        src: "",
        alt: "Seed highlight placeholder",
        imageSource: "media",
        imageUtilities: "object-cover",
        mediaId: "",
        mediaUrl: "",
      },
      contentBinding: {
        source: "editor" as const,
        key: "image",
        editorField: highlightImageField,
      },
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
      contentBinding: {
        source: "editor" as const,
        key: "headline",
        editorField: highlightHeadlineField,
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
          "Seeded library card with CMS headline/body and optional media image.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "body",
        editorField: highlightBodyField,
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
    "sb-card-image": {
      id: "sb-card-image",
      nodeId: "card-image",
      properties: [
        { type: "utility", property: "aspectRatio", value: "16/9" },
        { type: "utility", property: "width", value: "full" },
        { type: "utility", property: "borderRadius", value: "lg" },
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

const heroHeadlineField = {
  name: "hero-headline",
  type: "text" as const,
  required: true,
  label: "Hero headline",
} as const;

const heroBodyField = {
  name: "hero-body",
  type: "text" as const,
  required: false,
  label: "Hero body",
} as const;

const heroImageField = {
  name: "hero-image",
  type: "image" as const,
  required: false,
  label: "Hero image",
} as const;

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

export const seedHeroSectionComposition = {
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
        key: "hero-headline",
        editorField: heroHeadlineField,
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
        content:
          "Seeded hero section with editable headline/body and a media-backed image.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "hero-body",
        editorField: heroBodyField,
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
        key: "hero-image",
        editorField: heroImageField,
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

export const seedFeatureGridSectionComposition = {
  rootId: "features-root",
  nodes: {
    "features-root": {
      id: "features-root",
      kind: "primitive" as const,
      definitionKey: "primitive.section" as const,
      parentId: null,
      childIds: ["features-heading", "features-body", "features-grid"],
      styleBindingId: "sb-features-root",
      propValues: {},
    },
    "features-heading": {
      id: "features-heading",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "features-root",
      childIds: [],
      styleBindingId: "sb-features-heading",
      propValues: {
        content: "Everything your website launch needs",
        level: "h2",
      },
    },
    "features-body": {
      id: "features-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "features-root",
      childIds: [],
      styleBindingId: "sb-features-body",
      propValues: {
        content:
          "A realistic feature section with nested cards that designers can reuse across pages.",
      },
    },
    "features-grid": {
      id: "features-grid",
      kind: "primitive" as const,
      definitionKey: "primitive.section",
      parentId: "features-root",
      childIds: ["feature-card-1", "feature-card-2", "feature-card-3"],
      styleBindingId: "sb-features-grid",
      propValues: {},
    },
    "feature-card-1": {
      id: "feature-card-1",
      kind: "primitive" as const,
      definitionKey: "primitive.section",
      parentId: "features-grid",
      childIds: ["feature-card-1-title", "feature-card-1-body"],
      styleBindingId: "sb-feature-card-1",
      propValues: {},
    },
    "feature-card-1-title": {
      id: "feature-card-1-title",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "feature-card-1",
      childIds: [],
      styleBindingId: "sb-feature-card-1-title",
      propValues: { content: "Reusable sections", level: "h3" },
    },
    "feature-card-1-body": {
      id: "feature-card-1-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "feature-card-1",
      childIds: [],
      styleBindingId: "sb-feature-card-1-body",
      propValues: {
        content: "Drag this section in once and customize content per page.",
      },
    },
    "feature-card-2": {
      id: "feature-card-2",
      kind: "primitive" as const,
      definitionKey: "primitive.section",
      parentId: "features-grid",
      childIds: ["feature-card-2-title", "feature-card-2-body"],
      styleBindingId: "sb-feature-card-2",
      propValues: {},
    },
    "feature-card-2-title": {
      id: "feature-card-2-title",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "feature-card-2",
      childIds: [],
      styleBindingId: "sb-feature-card-2-title",
      propValues: { content: "Token-aware styling", level: "h3" },
    },
    "feature-card-2-body": {
      id: "feature-card-2-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "feature-card-2",
      childIds: [],
      styleBindingId: "sb-feature-card-2-body",
      propValues: {
        content:
          "Colors and typography stay aligned with design-system tokens.",
      },
    },
    "feature-card-3": {
      id: "feature-card-3",
      kind: "primitive" as const,
      definitionKey: "primitive.section",
      parentId: "features-grid",
      childIds: ["feature-card-3-title", "feature-card-3-body"],
      styleBindingId: "sb-feature-card-3",
      propValues: {},
    },
    "feature-card-3-title": {
      id: "feature-card-3-title",
      kind: "primitive" as const,
      definitionKey: "primitive.heading",
      parentId: "feature-card-3",
      childIds: [],
      styleBindingId: "sb-feature-card-3-title",
      propValues: { content: "Editor-friendly content", level: "h3" },
    },
    "feature-card-3-body": {
      id: "feature-card-3-body",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "feature-card-3",
      childIds: [],
      styleBindingId: "sb-feature-card-3-body",
      propValues: {
        content:
          "Update copy and media from CMS fields without changing layout structure.",
      },
    },
  },
  styleBindings: {
    "sb-features-root": {
      id: "sb-features-root",
      nodeId: "features-root",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "6" },
        { type: "utility", property: "padding", value: "8" },
        { type: "utility", property: "borderRadius", value: "2xl" },
        { type: "token", property: "background", token: "color.background" },
        { type: "token", property: "color", token: "color.foreground" },
      ],
    },
    "sb-features-heading": {
      id: "sb-features-heading",
      nodeId: "features-heading",
      properties: [
        { type: "utility", property: "fontSize", value: "4xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-features-body": {
      id: "sb-features-body",
      nodeId: "features-body",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-features-grid": {
      id: "sb-features-grid",
      nodeId: "features-grid",
      properties: [
        { type: "utility", property: "display", value: "grid" },
        { type: "utility", property: "gap", value: "4" },
      ],
    },
    "sb-feature-card-1": {
      id: "sb-feature-card-1",
      nodeId: "feature-card-1",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "3" },
        { type: "utility", property: "padding", value: "6" },
        { type: "utility", property: "borderRadius", value: "xl" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-feature-card-1-title": {
      id: "sb-feature-card-1-title",
      nodeId: "feature-card-1-title",
      properties: [
        { type: "utility", property: "fontSize", value: "xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-feature-card-1-body": {
      id: "sb-feature-card-1-body",
      nodeId: "feature-card-1-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-feature-card-2": {
      id: "sb-feature-card-2",
      nodeId: "feature-card-2",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "3" },
        { type: "utility", property: "padding", value: "6" },
        { type: "utility", property: "borderRadius", value: "xl" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-feature-card-2-title": {
      id: "sb-feature-card-2-title",
      nodeId: "feature-card-2-title",
      properties: [
        { type: "utility", property: "fontSize", value: "xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-feature-card-2-body": {
      id: "sb-feature-card-2-body",
      nodeId: "feature-card-2-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
    "sb-feature-card-3": {
      id: "sb-feature-card-3",
      nodeId: "feature-card-3",
      properties: [
        { type: "utility", property: "display", value: "flex" },
        { type: "utility", property: "flexDirection", value: "col" },
        { type: "utility", property: "gap", value: "3" },
        { type: "utility", property: "padding", value: "6" },
        { type: "utility", property: "borderRadius", value: "xl" },
        { type: "token", property: "background", token: "color.card" },
        { type: "token", property: "color", token: "color.card.foreground" },
      ],
    },
    "sb-feature-card-3-title": {
      id: "sb-feature-card-3-title",
      nodeId: "feature-card-3-title",
      properties: [
        { type: "utility", property: "fontSize", value: "xl" },
        { type: "utility", property: "fontWeight", value: "semibold" },
        { type: "utility", property: "lineHeight", value: "tight" },
      ],
    },
    "sb-feature-card-3-body": {
      id: "sb-feature-card-3-body",
      nodeId: "feature-card-3-body",
      properties: [
        { type: "utility", property: "fontSize", value: "base" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
        { type: "token", property: "color", token: "color.muted.foreground" },
      ],
    },
  },
} as const;

const ctaHeadlineField = {
  name: "cta-headline",
  type: "text" as const,
  required: true,
  label: "CTA headline",
} as const;

const ctaBodyField = {
  name: "cta-body",
  type: "text" as const,
  required: false,
  label: "CTA body",
} as const;

export const seedCtaSectionComposition = {
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
        key: "cta-headline",
        editorField: ctaHeadlineField,
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
          "Use this section near the bottom of a page to drive conversions with clear actions.",
      },
      contentBinding: {
        source: "editor" as const,
        key: "cta-body",
        editorField: ctaBodyField,
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

export type SeedPageTemplateOptions = {
  /** When `false`, the hero field omits `description` (narrower admin field). */
  heroHeadlineDescription?: string | false;
  /** E2E: hero is headline-only (matches a slim template surface area). */
  minimalHero?: boolean;
};

/**
 * Page template aligned with `defaultPageTemplateComposition()` (header / main+slot / footer),
 * plus a hero section and light header/footer chrome so the tree matches new templates from
 * Studio while demonstrating common section primitives.
 */
export function buildSeedPageTemplateComposition(
  options?: SeedPageTemplateOptions,
): PageComposition {
  const base = defaultPageTemplateComposition();
  const minimalHero = options?.minimalHero ?? false;

  let heroHeadlineEditorField: {
    name: "hero-headline";
    type: "text";
    required: true;
    label: "Hero headline";
    description?: string;
  } = {
    name: "hero-headline",
    type: "text",
    required: true,
    label: "Hero headline",
  };

  if (options?.heroHeadlineDescription !== false) {
    heroHeadlineEditorField = {
      ...heroHeadlineEditorField,
      description:
        typeof options?.heroHeadlineDescription === "string"
          ? options.heroHeadlineDescription
          : DEFAULT_HERO_HEADLINE_DESCRIPTION,
    };
  }

  const heroSubheadField = {
    name: "hero-subhead",
    type: "text" as const,
    required: false,
    label: "Hero subheading",
    description:
      "Supporting line under the hero headline (template CMS field).",
  };

  const heroSectionChildIds = minimalHero
    ? (["page-hero-heading"] as const)
    : (["page-hero-heading", "page-hero-subhead", "page-hero-cta"] as const);

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
      childIds: [...heroSectionChildIds],
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
      propValues: { content: "", level: "h1" },
      contentBinding: {
        source: "editor",
        key: "hero-headline",
        editorField: heroHeadlineEditorField,
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

  if (!minimalHero) {
    nodes["page-hero-subhead"] = {
      id: "page-hero-subhead",
      kind: "text",
      definitionKey: "primitive.text",
      parentId: "page-hero-section",
      childIds: [],
      styleBindingId: "sb-page-hero-subhead",
      propValues: { content: "" },
      contentBinding: {
        source: "editor",
        key: "hero-subhead",
        editorField: heroSubheadField,
      },
    };
    nodes["page-hero-cta"] = {
      id: "page-hero-cta",
      kind: "primitive",
      definitionKey: "primitive.button",
      parentId: "page-hero-section",
      childIds: [],
      propValues: {
        label: "Get started",
        linkType: "url",
        href: "#",
        collectionSlug: "",
        entrySlug: "",
        openInNewTab: false,
      },
    };
  }

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

  if (!minimalHero) {
    styleBindings["sb-page-hero-subhead"] = {
      id: "sb-page-hero-subhead",
      nodeId: "page-hero-subhead",
      properties: [
        { type: "utility", property: "fontSize", value: "lg" },
        { type: "utility", property: "lineHeight", value: "relaxed" },
      ],
    };
  }

  return PageCompositionSchema.parse({
    rootId: base.rootId,
    nodes,
    styleBindings,
  });
}

/** Library embed node id in {@link buildSeedPageTemplateWithLibraryComposition}. */
export const PAGE_MAIN_EMBED_LIBRARY_ID = "page-main-embed-highlight";
export const PAGE_MAIN_EMBED_HERO_SECTION_LIBRARY_ID =
  "page-main-embed-hero-section";
export const PAGE_MAIN_EMBED_FEATURE_GRID_LIBRARY_ID =
  "page-main-embed-feature-grid-section";
export const PAGE_MAIN_EMBED_CTA_SECTION_LIBRARY_ID =
  "page-main-embed-cta-section";
export const PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID =
  "page-main-embed-primary-button";

/** Attach CMS instance values to the seeded library ref (media IDs; expanded to URLs at render). */
export function withLibraryEmbedHighlightEditorFieldValues(
  composition: PageComposition,
  values: {
    headline?: string;
    body?: string;
    image: number;
    heroImage?: number;
  },
): PageComposition {
  const highlightNode = composition.nodes[PAGE_MAIN_EMBED_LIBRARY_ID];
  if (
    !highlightNode ||
    highlightNode.definitionKey !== "primitive.libraryComponent"
  ) {
    return composition;
  }
  const heroNode = composition.nodes[PAGE_MAIN_EMBED_HERO_SECTION_LIBRARY_ID];
  return PageCompositionSchema.parse({
    ...composition,
    nodes: {
      ...composition.nodes,
      [PAGE_MAIN_EMBED_LIBRARY_ID]: {
        ...highlightNode,
        propValues: {
          ...highlightNode.propValues,
          componentKey: SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
          editorFieldValues: {
            headline:
              values.headline ??
              "Main region — this highlight block sits below the hero. Replace with your sections.",
            body:
              values.body ??
              "Seeded content block with style bindings and media-backed image.",
            image: values.image,
          },
        },
      },
      ...(heroNode && heroNode.definitionKey === "primitive.libraryComponent"
        ? {
            [PAGE_MAIN_EMBED_HERO_SECTION_LIBRARY_ID]: {
              ...heroNode,
              propValues: {
                ...heroNode.propValues,
                componentKey: SEED_HERO_SECTION_COMPONENT_KEY,
                editorFieldValues: {
                  ...(typeof heroNode.propValues === "object" &&
                  heroNode.propValues !== null &&
                  "editorFieldValues" in heroNode.propValues &&
                  typeof (
                    heroNode.propValues as { editorFieldValues?: unknown }
                  ).editorFieldValues === "object" &&
                  (heroNode.propValues as { editorFieldValues?: unknown })
                    .editorFieldValues !== null
                    ? (
                        heroNode.propValues as {
                          editorFieldValues: Record<string, unknown>;
                        }
                      ).editorFieldValues
                    : {}),
                  ...(values.heroImage !== undefined
                    ? { "hero-image": values.heroImage }
                    : {}),
                },
              },
            },
          }
        : {}),
    },
  });
}

/**
 * Same as {@link buildSeedPageTemplateComposition}, plus a `primitive.libraryComponent`
 * references to all seeded library blocks (between hero and the `main` layout slot).
 */
export function buildSeedPageTemplateWithLibraryComposition(
  options?: SeedPageTemplateOptions,
): PageComposition {
  const base = buildSeedPageTemplateComposition(options);
  const pageMain = base.nodes["page-main"];
  if (!pageMain) {
    throw new Error("buildSeedPageTemplateComposition: missing page-main");
  }

  const slotIdx = pageMain.childIds.indexOf("page-main-slot");
  const libraryEmbedIds = [
    PAGE_MAIN_EMBED_HERO_SECTION_LIBRARY_ID,
    PAGE_MAIN_EMBED_FEATURE_GRID_LIBRARY_ID,
    PAGE_MAIN_EMBED_LIBRARY_ID,
    PAGE_MAIN_EMBED_CTA_SECTION_LIBRARY_ID,
    PAGE_MAIN_EMBED_PRIMARY_BUTTON_LIBRARY_ID,
  ] as const;
  const withRef: PageComposition["nodes"] = {
    ...base.nodes,
    [PAGE_MAIN_EMBED_HERO_SECTION_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_HERO_SECTION_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-main",
      childIds: [],
      propValues: {
        componentKey: SEED_HERO_SECTION_COMPONENT_KEY,
        editorFieldValues: {
          "hero-headline": "Build pages with composable sections",
          "hero-body":
            "The seed template embeds reusable hero/feature/CTA blocks so designers can start from realistic structure.",
        },
      },
    },
    [PAGE_MAIN_EMBED_FEATURE_GRID_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_FEATURE_GRID_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-main",
      childIds: [],
      propValues: { componentKey: SEED_FEATURE_GRID_SECTION_COMPONENT_KEY },
    },
    [PAGE_MAIN_EMBED_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-main",
      childIds: [],
      propValues: {
        componentKey: SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
        editorFieldValues: {
          headline: "Main region highlight block",
          body: "Seeded card content with CMS fields and media support.",
        },
      },
    },
    [PAGE_MAIN_EMBED_CTA_SECTION_LIBRARY_ID]: {
      id: PAGE_MAIN_EMBED_CTA_SECTION_LIBRARY_ID,
      kind: "designerComponent",
      definitionKey: "primitive.libraryComponent",
      parentId: "page-main",
      childIds: [],
      propValues: {
        componentKey: SEED_CTA_SECTION_COMPONENT_KEY,
        editorFieldValues: {
          "cta-headline": "Need a custom website system?",
          "cta-body":
            "Start from this CTA section and tailor the copy for your campaign.",
        },
      },
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
