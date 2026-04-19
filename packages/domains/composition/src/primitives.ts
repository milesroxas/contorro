import type { CompositionNode, PageComposition } from "@repo/contracts-zod";
import { PageCompositionSchema } from "@repo/contracts-zod";

import {
  DEFAULT_BACKGROUND_IMAGE_ATTACHMENT,
  DEFAULT_BACKGROUND_IMAGE_CLIP,
  DEFAULT_BACKGROUND_IMAGE_ORIGIN,
  DEFAULT_BACKGROUND_IMAGE_POSITION,
  DEFAULT_BACKGROUND_IMAGE_REPEAT,
  DEFAULT_BACKGROUND_IMAGE_SIZE,
} from "./box-background-image-style.js";

type PrimitiveSpec = {
  definitionKey: string;
  allowsChildren: boolean;
  availableInPalette: boolean;
  creatableInStudio: boolean;
  defaultPropValues: Record<string, unknown>;
};

const PRIMITIVE_SPECS = [
  {
    definitionKey: "primitive.box",
    allowsChildren: true,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: {
      tag: "div",
      backgroundImageAlt: "",
      backgroundImageAttachment: DEFAULT_BACKGROUND_IMAGE_ATTACHMENT,
      backgroundImageClip: DEFAULT_BACKGROUND_IMAGE_CLIP,
      backgroundImageEnabled: false,
      backgroundImageMediaUrl: "",
      backgroundImageOrigin: DEFAULT_BACKGROUND_IMAGE_ORIGIN,
      backgroundImagePosition: DEFAULT_BACKGROUND_IMAGE_POSITION,
      backgroundImageRepeat: DEFAULT_BACKGROUND_IMAGE_REPEAT,
      backgroundImageSize: DEFAULT_BACKGROUND_IMAGE_SIZE,
      backgroundImageSource: "media",
      backgroundImageSrc: "",
    },
  },
  {
    definitionKey: "primitive.section",
    allowsChildren: true,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: {},
  },
  {
    definitionKey: "primitive.text",
    allowsChildren: false,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: { content: "" },
  },
  {
    definitionKey: "primitive.heading",
    allowsChildren: false,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: { content: "Heading", level: "h2" },
  },
  {
    definitionKey: "primitive.button",
    allowsChildren: false,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: {
      label: "Button",
      linkType: "url",
      href: "",
      collectionSlug: "",
      entrySlug: "",
      openInNewTab: false,
    },
  },
  {
    definitionKey: "primitive.image",
    allowsChildren: false,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: {
      src: "",
      alt: "",
      imageSource: "media",
      imageUtilities: "object-cover",
    },
  },
  {
    definitionKey: "primitive.video",
    allowsChildren: false,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: {
      src: "",
      objectFit: "cover",
      videoSource: "media",
      poster: "",
      autoPlay: false,
      loop: false,
      muted: false,
      playsInline: true,
      controls: true,
      preload: "metadata",
    },
  },
  {
    definitionKey: "primitive.collection",
    allowsChildren: true,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: {
      collectionSlug: "",
      dynamicList: false,
      manualEntryIds: [],
      collectionSort: "-updatedAt",
      collectionFilters: [],
    },
  },
  {
    definitionKey: "primitive.slot",
    allowsChildren: false,
    availableInPalette: true,
    creatableInStudio: true,
    defaultPropValues: { slotId: "main" },
  },
  {
    definitionKey: "primitive.libraryComponent",
    allowsChildren: false,
    availableInPalette: false,
    creatableInStudio: true,
    defaultPropValues: {},
  },
] as const satisfies readonly PrimitiveSpec[];

const PRIMITIVE_SPEC_MAP: Map<string, PrimitiveSpec> = new Map(
  PRIMITIVE_SPECS.map((spec) => [spec.definitionKey, spec]),
);

export const KNOWN_PRIMITIVE_KEYS = PRIMITIVE_SPECS.map(
  (spec) => spec.definitionKey,
);

export const STUDIO_PALETTE_PRIMITIVE_KEYS = PRIMITIVE_SPECS.filter(
  (spec) => spec.availableInPalette,
).map((spec) => spec.definitionKey);

export function isKnownPrimitiveKey(definitionKey: string): boolean {
  return PRIMITIVE_SPEC_MAP.has(definitionKey);
}

export function isStudioPalettePrimitiveKey(definitionKey: string): boolean {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  return spec?.availableInPalette ?? false;
}

export function isStudioCreatablePrimitiveKey(definitionKey: string): boolean {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  return spec?.creatableInStudio ?? false;
}

export function isContainerPrimitiveKey(definitionKey: string): boolean {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  return spec?.allowsChildren ?? false;
}

export function defaultPrimitivePropValues(
  definitionKey: string,
): Record<string, unknown> {
  const spec = PRIMITIVE_SPEC_MAP.get(definitionKey);
  if (!spec) {
    return {};
  }
  return { ...spec.defaultPropValues };
}

export function primitiveKindForDefinitionKey(
  definitionKey: string,
): CompositionNode["kind"] {
  if (definitionKey === "primitive.text") {
    return "text";
  }
  if (definitionKey === "primitive.slot") {
    return "slot";
  }
  if (definitionKey === "primitive.libraryComponent") {
    return "designerComponent";
  }
  return "primitive";
}

const MINIMAL_PRIMITIVE_COMPOSITION_ROOT_ID = "seed-primitive-root";

/**
 * Single-node composition for a built-in primitive — store on `components` rows so they
 * qualify as library entries (Studio Components palette, expand, preview).
 */
export function minimalSinglePrimitiveComposition(
  definitionKey: string,
): PageComposition | null {
  if (
    !isKnownPrimitiveKey(definitionKey) ||
    definitionKey === "primitive.libraryComponent"
  ) {
    return null;
  }
  const kind = primitiveKindForDefinitionKey(definitionKey);
  const node: CompositionNode = {
    id: MINIMAL_PRIMITIVE_COMPOSITION_ROOT_ID,
    kind,
    definitionKey,
    parentId: null,
    childIds: [],
    propValues: defaultPrimitivePropValues(definitionKey),
  };
  return PageCompositionSchema.parse({
    rootId: MINIMAL_PRIMITIVE_COMPOSITION_ROOT_ID,
    nodes: { [MINIMAL_PRIMITIVE_COMPOSITION_ROOT_ID]: node },
    styleBindings: {},
  });
}
