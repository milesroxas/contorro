import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { PageComposition } from "@repo/contracts-zod";
import { utilityValuesForStyleProperty } from "@repo/contracts-zod";
import { BOX_BACKGROUND_IMAGE_TAILWIND_SAFESET } from "@repo/domains-composition";
import { StudioCanvas, StudioRoot } from "@repo/presentation-studio";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import {
  listCompositionUtilitySafelistClasses,
  renderComposition,
} from "@repo/runtime-renderer";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

function readTailwindSafelistCombinedCss(): string {
  const dir = resolve(process.cwd(), "src/app");
  const main = readFileSync(resolve(dir, "_tailwind-safelist.css"), "utf8");
  const generated = readFileSync(
    resolve(dir, "_tailwind-safelist-composition-generated.css"),
    "utf8",
  );
  return `${main}\n${generated}`;
}

function collectAtSourceInlineClasses(css: string): Set<string> {
  const out = new Set<string>();
  for (const match of css.matchAll(/@source inline\("([^"]+)"\);/g)) {
    for (const token of match[1].split(/\s+/)) {
      const trimmed = token.trim();
      if (trimmed.length > 0) {
        out.add(trimmed);
      }
    }
  }
  return out;
}

function imageComposition(): PageComposition {
  return {
    rootId: "root",
    nodes: {
      root: {
        id: "root",
        kind: "primitive",
        definitionKey: "primitive.box",
        parentId: null,
        childIds: ["image-1"],
        propValues: { tag: "div" },
      },
      "image-1": {
        id: "image-1",
        kind: "primitive",
        definitionKey: "primitive.image",
        parentId: "root",
        childIds: [],
        styleBindingId: "sb-image-1",
        propValues: {
          src: "https://example.com/preview.png",
          alt: "Preview image",
          imageUtilities: "object-cover",
        },
      },
    },
    styleBindings: {
      "sb-image-1": {
        id: "sb-image-1",
        nodeId: "image-1",
        properties: [
          { type: "utility", property: "aspectRatio", value: "16/9" },
          { type: "utility", property: "width", value: "full" },
        ],
      },
    },
  };
}

describe("Builder canvas styling safeguards", () => {
  beforeAll(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  });

  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("keeps generated composition safelist aligned with resolver output", () => {
    const css = readTailwindSafelistCombinedCss();
    const safelistedClasses = collectAtSourceInlineClasses(css);
    for (const cls of listCompositionUtilitySafelistClasses()) {
      expect(safelistedClasses.has(cls)).toBe(true);
    }
  });

  it("keeps globals safelist aligned with aspect ratio utility values", () => {
    const css = readTailwindSafelistCombinedCss();
    const safelistedClasses = collectAtSourceInlineClasses(css);
    const aspectValues = utilityValuesForStyleProperty("aspectRatio");
    for (const value of aspectValues) {
      expect(safelistedClasses.has(`aspect-${value}`)).toBe(true);
    }
  });

  it("keeps globals safelist aligned with overflow utility values", () => {
    const css = readTailwindSafelistCombinedCss();
    const safelistedClasses = collectAtSourceInlineClasses(css);
    for (const value of utilityValuesForStyleProperty("overflow")) {
      expect(safelistedClasses.has(`overflow-${value}`)).toBe(true);
    }
    for (const value of utilityValuesForStyleProperty("overflowX")) {
      expect(safelistedClasses.has(`overflow-x-${value}`)).toBe(true);
    }
    for (const value of utilityValuesForStyleProperty("overflowY")) {
      expect(safelistedClasses.has(`overflow-y-${value}`)).toBe(true);
    }
  });

  it("keeps globals safelist aligned with box background image Tailwind classes", () => {
    const css = readTailwindSafelistCombinedCss();
    const safelistedClasses = collectAtSourceInlineClasses(css);
    for (const tw of BOX_BACKGROUND_IMAGE_TAILWIND_SAFESET) {
      expect(safelistedClasses.has(tw)).toBe(true);
    }
  });

  it("renders publish output image with utility aspect classes", () => {
    const composition = imageComposition();
    render(renderComposition(composition, defaultPrimitiveRegistry, []));

    const image = screen.getByRole("img", { name: "Preview image" });
    const imageClasses = (image.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean);

    expect(imageClasses).toContain("aspect-16/9");
    expect(imageClasses).toContain("w-full");
  });

  it("renders canvas preview image without legacy layout wrapper", () => {
    const composition = imageComposition();
    render(
      createElement(
        StudioRoot,
        null,
        createElement(StudioCanvas, {
          activeBreakpoint: null,
          canvasViewportWidthPx: 1280,
          canvasZoomPercent: 100,
          canvasFontSizePx: 16,
          composition,
          selectedNodeId: null,
          onSelectNode: () => {},
          onRemoveNode: () => {},
          onWrapNode: () => {},
          onCanvasBackground: () => {},
          onActiveBreakpointChange: () => {},
          onCanvasViewportWidthPxChange: () => {},
          onCanvasZoomPercentChange: () => {},
          onCanvasFontSizePxChange: () => {},
          studioResource: null,
          theme: "light",
          onToggleTheme: () => {},
          tokenMeta: [],
        }),
      ),
    );

    const preview = screen.getByTestId("studio-canvas-preview");
    const image = preview.querySelector('img[alt="Preview image"]');
    expect(image).not.toBeNull();
    if (!image) {
      return;
    }

    const imageClasses = (image.getAttribute("class") ?? "")
      .split(/\s+/)
      .filter(Boolean);

    expect(imageClasses).toContain("aspect-16/9");
    expect(imageClasses).toContain("w-full");
    expect(preview.querySelector(".inline-block.max-w-full")).toBeNull();
  });
});
