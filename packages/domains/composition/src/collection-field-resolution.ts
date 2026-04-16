import type { CompositionNode } from "@repo/contracts-zod";

import { resolvedPrimitiveMediaSrc } from "./resolved-primitive-media-src.js";

/** Walk dotted paths on plain objects (Payload REST shapes). */
export function valueAtJsonPath(obj: unknown, path: string): unknown {
  const trimmed = path.trim();
  if (trimmed === "") {
    return undefined;
  }
  const parts = trimmed.split(".");
  let cur: unknown = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") {
      return undefined;
    }
    cur = (cur as Record<string, unknown>)[p];
  }
  return cur;
}

export function stringFromCollectionFieldValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (typeof val === "string") {
    return val;
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return String(val);
  }
  return "";
}

export function mediaUrlFromCollectionValue(val: unknown): string {
  if (val === null || val === undefined) {
    return "";
  }
  if (typeof val === "string") {
    return val.trim();
  }
  if (typeof val === "object" && "url" in val) {
    const u = (val as { url?: unknown }).url;
    return typeof u === "string" ? u.trim() : "";
  }
  return "";
}

function altFromCollectionMediaValue(val: unknown): string {
  if (typeof val === "object" && val !== null && "alt" in val) {
    const a = (val as { alt?: unknown }).alt;
    return typeof a === "string" ? a : "";
  }
  return "";
}

function textContentFallbackWithoutCollection(node: CompositionNode): string {
  const cb = node.contentBinding;
  const fromProps =
    typeof node.propValues?.content === "string"
      ? node.propValues.content
      : undefined;
  let fallback = "";
  if (cb?.source === "editor" && cb.editorField) {
    fallback =
      typeof cb.editorField.defaultValue === "string"
        ? cb.editorField.defaultValue
        : `[${cb.key}]`;
  } else if (cb) {
    fallback = `[${cb.key}]`;
  }
  return fromProps ?? fallback;
}

/**
 * Resolves visible text for `primitive.text` / `primitive.heading` (and button labels).
 * Collection values win when `contentBinding.source === "collection"` and a row doc is present.
 */
export function resolvePrimitiveTextContent(
  node: CompositionNode,
  collectionDoc: Record<string, unknown> | null | undefined,
): string {
  const cb = node.contentBinding;
  const fromProps =
    typeof node.propValues?.content === "string"
      ? node.propValues.content
      : undefined;

  if (cb?.source !== "collection" || cb.key.trim() === "") {
    return textContentFallbackWithoutCollection(node);
  }

  if (collectionDoc) {
    const v = stringFromCollectionFieldValue(
      valueAtJsonPath(collectionDoc, cb.key.trim()),
    );
    if (v !== "") {
      return v;
    }
  }
  if (fromProps !== undefined) {
    return fromProps;
  }
  return `[${cb.key}]`;
}

export function resolvePrimitiveButtonLabel(
  node: CompositionNode,
  collectionDoc: Record<string, unknown> | null | undefined,
): string {
  const cb = node.contentBinding;
  const fromProps =
    typeof node.propValues?.label === "string" ? node.propValues.label : "";
  const defaultLabel = fromProps.trim() !== "" ? fromProps : "Button";

  if (cb?.source === "collection" && cb.key.trim() !== "") {
    if (collectionDoc) {
      const v = stringFromCollectionFieldValue(
        valueAtJsonPath(collectionDoc, cb.key.trim()),
      );
      if (v !== "") {
        return v;
      }
    }
    return defaultLabel;
  }
  return defaultLabel;
}

export function resolvePrimitiveImageSrcAlt(
  node: CompositionNode,
  collectionDoc: Record<string, unknown> | null | undefined,
): { src: string; alt: string } {
  const cb = node.contentBinding;
  const baseSrc = resolvedPrimitiveMediaSrc(node.propValues);
  const baseAlt =
    typeof node.propValues?.alt === "string" ? node.propValues.alt : "";

  if (cb?.source === "collection" && cb.key.trim() !== "" && collectionDoc) {
    const raw = valueAtJsonPath(collectionDoc, cb.key.trim());
    const derived = mediaUrlFromCollectionValue(raw);
    if (derived !== "") {
      const altFromDoc = altFromCollectionMediaValue(raw);
      return {
        src: derived,
        alt: altFromDoc !== "" ? altFromDoc : baseAlt,
      };
    }
  }

  return { src: baseSrc, alt: baseAlt };
}

export function resolvePrimitiveVideoSrc(
  node: CompositionNode,
  collectionDoc: Record<string, unknown> | null | undefined,
): string {
  const cb = node.contentBinding;
  const base = resolvedPrimitiveMediaSrc(node.propValues);
  if (cb?.source === "collection" && cb.key.trim() !== "" && collectionDoc) {
    const raw = valueAtJsonPath(collectionDoc, cb.key.trim());
    const derived = mediaUrlFromCollectionValue(raw);
    if (derived !== "") {
      return derived;
    }
  }
  return base;
}
