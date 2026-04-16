"use client";

import { resolvePrimitiveVideoSrc } from "@repo/domains-composition";
import type { RuntimePrimitiveProps } from "@repo/domains-runtime-catalog";

import { useOptionalCollectionItemDoc } from "./collection-item-context.js";
import { PrimitiveEmptyState } from "./primitive-empty-state.js";

const OBJECT_FITS = new Set(["cover", "contain", "fill", "none"]);
const PRELOADS = new Set(["none", "metadata", "auto"]);

function boolProp(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return defaultValue;
}

/** Video: resolved src/mediaUrl, poster, HTML media attributes, objectFit for layout */
export function Video({ node, className, style }: RuntimePrimitiveProps) {
  const doc = useOptionalCollectionItemDoc();
  const src = resolvePrimitiveVideoSrc(node, doc);
  const width = node.propValues?.width as string | number | undefined;
  const height = node.propValues?.height as string | number | undefined;
  const rawFit = node.propValues?.objectFit as string | undefined;
  const objectFit = rawFit && OBJECT_FITS.has(rawFit) ? rawFit : "cover";
  const posterRaw = node.propValues?.poster as string | undefined;
  const poster =
    typeof posterRaw === "string" && posterRaw.trim().length > 0
      ? posterRaw
      : undefined;

  const autoPlay = Boolean(node.propValues?.autoPlay);
  const loop = Boolean(node.propValues?.loop);
  const muted = boolProp(node.propValues?.muted, false);
  const playsInline = boolProp(node.propValues?.playsInline, true);
  const controls = boolProp(node.propValues?.controls, true);

  const rawPreload = node.propValues?.preload as string | undefined;
  const preload =
    rawPreload && PRELOADS.has(rawPreload) ? rawPreload : "metadata";

  const hasSource = src.trim().length > 0;

  if (!hasSource) {
    return (
      <PrimitiveEmptyState
        aria-label="Video placeholder"
        className={className}
        style={style}
        variant="centered"
      >
        <span className="text-xs font-semibold tracking-widest uppercase">
          Video
        </span>
      </PrimitiveEmptyState>
    );
  }

  return (
    <video
      autoPlay={autoPlay}
      className={className}
      controls={controls}
      height={typeof height === "number" ? height : undefined}
      loop={loop}
      muted={muted}
      playsInline={playsInline}
      poster={poster}
      preload={preload}
      src={src}
      style={{
        objectFit: objectFit as "cover" | "contain" | "fill" | "none",
        ...style,
      }}
      width={typeof width === "number" ? width : undefined}
    />
  );
}
