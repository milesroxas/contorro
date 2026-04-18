import {
  cssUrlDeclaration,
  resolvedPrefixedMediaSrc,
} from "./resolved-prefixed-media-src.js";

/** Stored prop keys for box background styling (Tailwind `bg-*` alignment). */
export type BoxBackgroundImageStylePropKey =
  | "backgroundImageAttachment"
  | "backgroundImageClip"
  | "backgroundImageOrigin"
  | "backgroundImagePosition"
  | "backgroundImageRepeat"
  | "backgroundImageSize";

const SIZE = ["auto", "cover", "contain"] as const;
export type BackgroundImageSizeToken = (typeof SIZE)[number];

export const BACKGROUND_IMAGE_SIZE_OPTIONS: ReadonlyArray<{
  label: string;
  tailwind: string;
  value: BackgroundImageSizeToken;
}> = [
  { value: "auto", label: "Auto", tailwind: "bg-auto" },
  { value: "cover", label: "Cover", tailwind: "bg-cover" },
  { value: "contain", label: "Contain", tailwind: "bg-contain" },
];

const POSITION = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
] as const;
export type BackgroundImagePositionToken = (typeof POSITION)[number];

export const BACKGROUND_IMAGE_POSITION_OPTIONS: ReadonlyArray<{
  label: string;
  tailwind: string;
  value: BackgroundImagePositionToken;
}> = [
  { value: "center", label: "Center", tailwind: "bg-center" },
  { value: "top", label: "Top", tailwind: "bg-top" },
  { value: "bottom", label: "Bottom", tailwind: "bg-bottom" },
  { value: "left", label: "Left", tailwind: "bg-left" },
  { value: "right", label: "Right", tailwind: "bg-right" },
  { value: "top-left", label: "Top left", tailwind: "bg-left-top" },
  { value: "top-right", label: "Top right", tailwind: "bg-right-top" },
  { value: "bottom-left", label: "Bottom left", tailwind: "bg-left-bottom" },
  { value: "bottom-right", label: "Bottom right", tailwind: "bg-right-bottom" },
];

const REPEAT = [
  "repeat",
  "no-repeat",
  "repeat-x",
  "repeat-y",
  "space",
  "round",
] as const;
export type BackgroundImageRepeatToken = (typeof REPEAT)[number];

export const BACKGROUND_IMAGE_REPEAT_OPTIONS: ReadonlyArray<{
  label: string;
  tailwind: string;
  value: BackgroundImageRepeatToken;
}> = [
  { value: "no-repeat", label: "No repeat", tailwind: "bg-no-repeat" },
  { value: "repeat", label: "Repeat", tailwind: "bg-repeat" },
  { value: "repeat-x", label: "Repeat X", tailwind: "bg-repeat-x" },
  { value: "repeat-y", label: "Repeat Y", tailwind: "bg-repeat-y" },
  { value: "space", label: "Space", tailwind: "bg-repeat-space" },
  { value: "round", label: "Round", tailwind: "bg-repeat-round" },
];

const ATTACHMENT = ["scroll", "fixed", "local"] as const;
export type BackgroundImageAttachmentToken = (typeof ATTACHMENT)[number];

export const BACKGROUND_IMAGE_ATTACHMENT_OPTIONS: ReadonlyArray<{
  label: string;
  tailwind: string;
  value: BackgroundImageAttachmentToken;
}> = [
  { value: "scroll", label: "Scroll", tailwind: "bg-scroll" },
  { value: "fixed", label: "Fixed", tailwind: "bg-fixed" },
  { value: "local", label: "Local", tailwind: "bg-local" },
];

const ORIGIN = ["border-box", "padding-box", "content-box"] as const;
export type BackgroundImageOriginToken = (typeof ORIGIN)[number];

export const BACKGROUND_IMAGE_ORIGIN_OPTIONS: ReadonlyArray<{
  label: string;
  tailwind: string;
  value: BackgroundImageOriginToken;
}> = [
  { value: "border-box", label: "Border box", tailwind: "bg-origin-border" },
  { value: "padding-box", label: "Padding box", tailwind: "bg-origin-padding" },
  { value: "content-box", label: "Content box", tailwind: "bg-origin-content" },
];

const CLIP = ["border-box", "padding-box", "content-box", "text"] as const;
export type BackgroundImageClipToken = (typeof CLIP)[number];

export const BACKGROUND_IMAGE_CLIP_OPTIONS: ReadonlyArray<{
  label: string;
  tailwind: string;
  value: BackgroundImageClipToken;
}> = [
  { value: "border-box", label: "Border box", tailwind: "bg-clip-border" },
  { value: "padding-box", label: "Padding box", tailwind: "bg-clip-padding" },
  { value: "content-box", label: "Content box", tailwind: "bg-clip-content" },
  { value: "text", label: "Text", tailwind: "bg-clip-text" },
];

export const DEFAULT_BACKGROUND_IMAGE_SIZE: BackgroundImageSizeToken = "cover";
export const DEFAULT_BACKGROUND_IMAGE_POSITION: BackgroundImagePositionToken =
  "center";
export const DEFAULT_BACKGROUND_IMAGE_REPEAT: BackgroundImageRepeatToken =
  "no-repeat";
export const DEFAULT_BACKGROUND_IMAGE_ATTACHMENT: BackgroundImageAttachmentToken =
  "scroll";
export const DEFAULT_BACKGROUND_IMAGE_ORIGIN: BackgroundImageOriginToken =
  "padding-box";
export const DEFAULT_BACKGROUND_IMAGE_CLIP: BackgroundImageClipToken =
  "border-box";

function isSizeToken(raw: unknown): raw is BackgroundImageSizeToken {
  return raw === "auto" || raw === "cover" || raw === "contain";
}

function isPositionToken(raw: unknown): raw is BackgroundImagePositionToken {
  return (
    raw === "center" ||
    raw === "top" ||
    raw === "bottom" ||
    raw === "left" ||
    raw === "right" ||
    raw === "top-left" ||
    raw === "top-right" ||
    raw === "bottom-left" ||
    raw === "bottom-right"
  );
}

function isRepeatToken(raw: unknown): raw is BackgroundImageRepeatToken {
  return (
    raw === "repeat" ||
    raw === "no-repeat" ||
    raw === "repeat-x" ||
    raw === "repeat-y" ||
    raw === "space" ||
    raw === "round"
  );
}

function isAttachmentToken(
  raw: unknown,
): raw is BackgroundImageAttachmentToken {
  return raw === "scroll" || raw === "fixed" || raw === "local";
}

function isOriginToken(raw: unknown): raw is BackgroundImageOriginToken {
  return raw === "border-box" || raw === "padding-box" || raw === "content-box";
}

function isClipToken(raw: unknown): raw is BackgroundImageClipToken {
  return (
    raw === "border-box" ||
    raw === "padding-box" ||
    raw === "content-box" ||
    raw === "text"
  );
}

export function normalizedBackgroundImageSize(
  raw: unknown,
): BackgroundImageSizeToken {
  return isSizeToken(raw) ? raw : DEFAULT_BACKGROUND_IMAGE_SIZE;
}

export function normalizedBackgroundImagePosition(
  raw: unknown,
): BackgroundImagePositionToken {
  return isPositionToken(raw) ? raw : DEFAULT_BACKGROUND_IMAGE_POSITION;
}

export function normalizedBackgroundImageRepeat(
  raw: unknown,
): BackgroundImageRepeatToken {
  return isRepeatToken(raw) ? raw : DEFAULT_BACKGROUND_IMAGE_REPEAT;
}

export function normalizedBackgroundImageAttachment(
  raw: unknown,
): BackgroundImageAttachmentToken {
  return isAttachmentToken(raw) ? raw : DEFAULT_BACKGROUND_IMAGE_ATTACHMENT;
}

export function normalizedBackgroundImageOrigin(
  raw: unknown,
): BackgroundImageOriginToken {
  return isOriginToken(raw) ? raw : DEFAULT_BACKGROUND_IMAGE_ORIGIN;
}

export function normalizedBackgroundImageClip(
  raw: unknown,
): BackgroundImageClipToken {
  return isClipToken(raw) ? raw : DEFAULT_BACKGROUND_IMAGE_CLIP;
}

const BACKGROUND_IMAGE_OPTION_ROWS_FOR_SAFESET = [
  ...BACKGROUND_IMAGE_SIZE_OPTIONS,
  ...BACKGROUND_IMAGE_POSITION_OPTIONS,
  ...BACKGROUND_IMAGE_REPEAT_OPTIONS,
  ...BACKGROUND_IMAGE_ATTACHMENT_OPTIONS,
  ...BACKGROUND_IMAGE_ORIGIN_OPTIONS,
  ...BACKGROUND_IMAGE_CLIP_OPTIONS,
] as const;

/**
 * Sorted unique Tailwind classes emitted at runtime for box background images.
 * Keep `apps/cms/src/app/_tailwind-safelist.css` in sync; guarded by `studio-canvas-styling` int spec (reads combined safelist CSS).
 */
export const BOX_BACKGROUND_IMAGE_TAILWIND_SAFESET: readonly string[] =
  Array.from(
    new Set(
      BACKGROUND_IMAGE_OPTION_ROWS_FOR_SAFESET.map((row) => row.tailwind),
    ),
  ).sort((a, b) => a.localeCompare(b));

function tailwindClassForOptionValue<T extends string>(
  options: ReadonlyArray<{ value: T; tailwind: string }>,
  value: T,
): string {
  return options.find((row) => row.value === value)?.tailwind ?? "";
}

function backgroundImageUtilityClassNameParts(
  propValues: Record<string, unknown>,
): string[] {
  const size = normalizedBackgroundImageSize(propValues.backgroundImageSize);
  const position = normalizedBackgroundImagePosition(
    propValues.backgroundImagePosition,
  );
  const repeat = normalizedBackgroundImageRepeat(
    propValues.backgroundImageRepeat,
  );
  const attachment = normalizedBackgroundImageAttachment(
    propValues.backgroundImageAttachment,
  );
  const origin = normalizedBackgroundImageOrigin(
    propValues.backgroundImageOrigin,
  );
  const clip = normalizedBackgroundImageClip(propValues.backgroundImageClip);
  return [
    tailwindClassForOptionValue(BACKGROUND_IMAGE_SIZE_OPTIONS, size),
    tailwindClassForOptionValue(BACKGROUND_IMAGE_POSITION_OPTIONS, position),
    tailwindClassForOptionValue(BACKGROUND_IMAGE_REPEAT_OPTIONS, repeat),
    tailwindClassForOptionValue(
      BACKGROUND_IMAGE_ATTACHMENT_OPTIONS,
      attachment,
    ),
    tailwindClassForOptionValue(BACKGROUND_IMAGE_ORIGIN_OPTIONS, origin),
    tailwindClassForOptionValue(BACKGROUND_IMAGE_CLIP_OPTIONS, clip),
  ].filter((c) => c.length > 0);
}

export type ResolvedBoxBackgroundImagePresentation = {
  /** Tailwind utilities from {@link BACKGROUND_IMAGE_*_OPTIONS} (dynamic URL is not expressible as static utilities). */
  className: string;
  /** Inline style: only `backgroundImage` with the resolved `url(...)`. */
  style: Record<string, string>;
};

/**
 * Resolves box background image for runtime: dynamic image URL as inline `backgroundImage`,
 * all other facets as Tailwind classes from the same option tables used in Studio.
 */
export function resolvedBoxBackgroundImagePresentation(
  propValues: Record<string, unknown> | null | undefined,
): ResolvedBoxBackgroundImagePresentation {
  if (!propValues || propValues.backgroundImageEnabled !== true) {
    return { className: "", style: {} };
  }
  const url = resolvedPrefixedMediaSrc(
    propValues,
    "backgroundImageSrc",
    "backgroundImageMediaUrl",
  );
  if (url.length === 0) {
    return { className: "", style: {} };
  }
  const className = backgroundImageUtilityClassNameParts(propValues).join(" ");
  return {
    className,
    style: { backgroundImage: cssUrlDeclaration(url) },
  };
}
