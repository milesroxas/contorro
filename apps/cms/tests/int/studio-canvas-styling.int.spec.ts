import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { PageComposition } from "@repo/contracts-zod";
import { utilityValuesForStyleProperty } from "@repo/contracts-zod";
import { defaultPrimitiveRegistry } from "@repo/runtime-primitives";
import { renderComposition } from "@repo/runtime-renderer";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { StudioCanvas, StudioRoot } from "@repo/presentation-studio";

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
          objectFit: "cover",
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

  it("keeps globals safelist aligned with aspect ratio utility values", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/_tailwind-safelist.css"),
      "utf8",
    );
    const safelistMatch = css.match(/@source inline\("([^"]+)"\);/);
    expect(safelistMatch).toBeTruthy();
    if (!safelistMatch) {
      return;
    }

    const safelistedClasses = new Set(
      safelistMatch[1]
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean),
    );
    const aspectValues = utilityValuesForStyleProperty("aspectRatio");
    for (const value of aspectValues) {
      expect(safelistedClasses.has(`aspect-${value}`)).toBe(true);
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
          composition,
          selectedNodeId: null,
          onSelectNode: () => {},
          onRemoveNode: () => {},
          onCanvasBackground: () => {},
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
