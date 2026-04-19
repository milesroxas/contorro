import { BREAKPOINT_MIN_WIDTH_PX, type Breakpoint } from "@repo/contracts-zod";

export const DEFAULT_CANVAS_VIEWPORT_WIDTH_PX = 1280;
export const MIN_CANVAS_VIEWPORT_WIDTH_PX = 280;
export const MAX_CANVAS_VIEWPORT_WIDTH_PX = 6000;

export const DEFAULT_CANVAS_ZOOM_PERCENT = 100;
export const MIN_CANVAS_ZOOM_PERCENT = 25;
export const MAX_CANVAS_ZOOM_PERCENT = 250;

export const DEFAULT_CANVAS_FONT_SIZE_PX = 16;
export const MIN_CANVAS_FONT_SIZE_PX = 12;
export const MAX_CANVAS_FONT_SIZE_PX = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeRoundedNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.round(value);
}

export function defaultCanvasViewportWidthPx(
  breakpoint: Breakpoint | null,
): number {
  if (breakpoint === null) {
    return DEFAULT_CANVAS_VIEWPORT_WIDTH_PX;
  }
  return BREAKPOINT_MIN_WIDTH_PX[breakpoint];
}

export function normalizeCanvasViewportWidthPx(value: number): number {
  return clamp(
    safeRoundedNumber(value, DEFAULT_CANVAS_VIEWPORT_WIDTH_PX),
    MIN_CANVAS_VIEWPORT_WIDTH_PX,
    MAX_CANVAS_VIEWPORT_WIDTH_PX,
  );
}

export function normalizeCanvasZoomPercent(value: number): number {
  return clamp(
    safeRoundedNumber(value, DEFAULT_CANVAS_ZOOM_PERCENT),
    MIN_CANVAS_ZOOM_PERCENT,
    MAX_CANVAS_ZOOM_PERCENT,
  );
}

export function normalizeCanvasFontSizePx(value: number): number {
  return clamp(
    safeRoundedNumber(value, DEFAULT_CANVAS_FONT_SIZE_PX),
    MIN_CANVAS_FONT_SIZE_PX,
    MAX_CANVAS_FONT_SIZE_PX,
  );
}
