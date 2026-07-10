import { blockCatalogEntry, PageCompositionSchema } from "@repo/contracts-zod";
import { mergePageContentSlotsToSlotOrder } from "@repo/domains-composition";
import { blocksFromCatalog } from "@repo/infrastructure-payload-config";
import {
  defaultPrimitiveRegistry,
  injectBlockValues,
  renderComposition,
} from "@repo/runtime-renderer";
import type { Payload } from "payload";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  lexicalRichText,
  seedCardDesignComposition,
  seedHeroDesignComposition,
} from "../../src/seeds/seed-content-fixtures.js";
import { closeTestPayload, getTestPayload } from "../helpers/getTestPayload.js";

const heroEntry = blockCatalogEntry("hero");
if (!heroEntry) {
  throw new Error("hero missing from BLOCK_CATALOG");
}
const cardEntry = blockCatalogEntry("card");
if (!cardEntry) {
  throw new Error("card missing from BLOCK_CATALOG");
}

describe("blocks content model", () => {
  afterAll(async () => {
    await closeTestPayload();
  });

  describe("injectBlockValues", () => {
    const design = PageCompositionSchema.parse(seedHeroDesignComposition);

    it("patches bound nodes from typed block values (populated relations)", () => {
      const injected = injectBlockValues(
        design,
        {
          heading: "Injected heading",
          body: lexicalRichText("Injected body text"),
          image: { id: 7, url: "/media/x.avif", alt: "Alt text" },
          primaryButton: {
            label: "Go",
            linkType: "url",
            url: "/go",
            openInNewTab: true,
          },
          secondaryButton: {
            label: "Later",
            linkType: "url",
            url: "/later",
            openInNewTab: false,
          },
        },
        heroEntry,
      );

      expect(injected.nodes["hero-heading"].propValues?.content).toBe(
        "Injected heading",
      );
      expect(injected.nodes["hero-body"].propValues?.content).toBe(
        "Injected body text",
      );
      expect(injected.nodes["hero-image"].propValues?.src).toBe(
        "/media/x.avif",
      );
      expect(injected.nodes["hero-image"].propValues?.alt).toBe("Alt text");
      expect(injected.nodes["hero-primary-button"].propValues).toMatchObject({
        label: "Go",
        href: "/go",
        openInNewTab: true,
      });
      expect(injected.nodes["hero-secondary-button"].propValues).toMatchObject({
        label: "Later",
        href: "/later",
      });
    });

    it("never blanks authored content when values are missing (audit §1.3)", () => {
      const injected = injectBlockValues(design, {}, heroEntry);
      expect(injected.nodes["hero-heading"].propValues?.content).toBe(
        design.nodes["hero-heading"].propValues?.content,
      );
      expect(injected.nodes["hero-primary-button"].propValues?.href).toBe(
        "/studio",
      );
    });

    it("skips unpopulated image relations instead of blanking src", () => {
      const injected = injectBlockValues(design, { image: 42 }, heroEntry);
      expect(injected.nodes["hero-image"].propValues?.src).toBe(
        design.nodes["hero-image"].propValues?.src,
      );
    });

    it("builds page-relation button hrefs from the populated page slug", () => {
      const injected = injectBlockValues(
        design,
        {
          primaryButton: {
            label: "Read more",
            linkType: "page",
            page: { id: 3, slug: "about" },
            openInNewTab: false,
          },
        },
        heroEntry,
      );
      expect(injected.nodes["hero-primary-button"].propValues?.href).toBe(
        "/about",
      );
    });

    it("ignores slot fields in value patching (children render via the slot pipeline)", () => {
      const injected = injectBlockValues(
        design,
        { slot: [{ blockType: "card" }] },
        heroEntry,
      );
      expect(injected.nodes["hero-slot"].propValues).toEqual(
        design.nodes["hero-slot"].propValues,
      );
    });
  });

  describe("injectBlockValues — card link + visibility (PR 01/02)", () => {
    const design = PageCompositionSchema.parse(seedCardDesignComposition);

    it("patches href onto the link-bound container from a URL link value", () => {
      const injected = injectBlockValues(
        design,
        {
          link: { linkType: "url", url: "/features", openInNewTab: true },
        },
        cardEntry,
      );
      expect(injected.nodes["cardblock-linked"].propValues).toMatchObject({
        href: "/features",
        openInNewTab: true,
      });
    });

    it("resolves page-relation link targets to /slug", () => {
      const injected = injectBlockValues(
        design,
        { link: { linkType: "page", page: { id: 3, slug: "about" } } },
        cardEntry,
      );
      expect(injected.nodes["cardblock-linked"].propValues?.href).toBe(
        "/about",
      );
    });

    it("leaves the container unpatched for an empty link target (no dead anchor)", () => {
      const injected = injectBlockValues(
        design,
        { link: { linkType: "url", url: "", openInNewTab: false } },
        cardEntry,
      );
      expect(injected.nodes["cardblock-linked"].propValues?.href).toBe(
        undefined,
      );
    });

    it("hides a node whose bound visibility checkbox is false", () => {
      const injected = injectBlockValues(
        design,
        { imageVisible: false },
        cardEntry,
      );
      expect(injected.nodes["cardblock-image"].visibility?.hidden).toBe(true);
      expect(injected.nodes["cardblock-body"].visibility?.hidden).toBe(
        undefined,
      );
    });

    it("keeps nodes visible for true or unset visibility values", () => {
      const injected = injectBlockValues(
        design,
        { bodyVisible: true },
        cardEntry,
      );
      expect(injected.nodes["cardblock-body"].visibility?.hidden).toBe(
        undefined,
      );
      expect(injected.nodes["cardblock-button"].visibility?.hidden).toBe(
        undefined,
      );
    });
  });

  describe("render pipeline — link wrap, hidden nodes, slot injection", () => {
    const cardDesign = PageCompositionSchema.parse(seedCardDesignComposition);
    const heroDesign = PageCompositionSchema.parse(seedHeroDesignComposition);

    it("wraps a link-bound container in an anchor on render", () => {
      const injected = injectBlockValues(
        cardDesign,
        { link: { linkType: "url", url: "/features", openInNewTab: true } },
        cardEntry,
      );
      const html = renderToStaticMarkup(
        renderComposition(injected, defaultPrimitiveRegistry),
      );
      expect(html).toContain('href="/features"');
      expect(html).toContain('target="_blank"');
    });

    it("renders no anchor when the link value is empty", () => {
      const html = renderToStaticMarkup(
        renderComposition(cardDesign, defaultPrimitiveRegistry),
      );
      expect(html).not.toContain('href="/features"');
    });

    it("omits editor-hidden nodes from the published markup", () => {
      const injected = injectBlockValues(
        cardDesign,
        { bodyVisible: false },
        cardEntry,
      );
      const html = renderToStaticMarkup(
        renderComposition(injected, defaultPrimitiveRegistry),
      );
      expect(html).not.toContain("Card design body copy");
      // Sibling button still renders.
      expect(html).toContain("Learn more");
    });

    it("injects slotContent under the design's bound slot node", () => {
      const html = renderToStaticMarkup(
        renderComposition(heroDesign, defaultPrimitiveRegistry, {
          slotContent: {
            "hero-slot": createElement("p", null, "Nested child block"),
          },
        }),
      );
      expect(html).toContain("Nested child block");
    });
  });

  describe("blocksFromCatalog slot nesting guard (PR 03)", () => {
    it("emits nested blocks for slot fields at the top level only", () => {
      const topLevel = blocksFromCatalog();
      const hero = topLevel.find((b) => b.slug === "hero");
      const slotField = hero?.fields.find(
        (f) => "name" in f && f.name === "slot",
      );
      expect(slotField?.type).toBe("blocks");
    });

    it("drops slot fields from nested blocks (allowSlots: false)", () => {
      const nested = blocksFromCatalog({ allowSlots: false });
      for (const block of nested) {
        const hasSlotField = block.fields.some(
          (f) => "name" in f && f.name === "slot" && f.type === "blocks",
        );
        expect(hasSlotField).toBe(false);
      }
    });
  });

  describe("mergePageContentSlotsToSlotOrder", () => {
    it("appends blocks from removed slots to the first row (audit §1.6)", () => {
      const merged = mergePageContentSlotsToSlotOrder(
        ["main"],
        [
          { slotId: "main", blocks: [{ blockType: "hero" }] },
          { slotId: "aside", blocks: [{ blockType: "content" }] },
        ],
      );
      expect(merged).toEqual([
        {
          slotId: "main",
          blocks: [{ blockType: "hero" }, { blockType: "content" }],
        },
      ]);
    });
  });

  describe("components publish validation", () => {
    let payload: Payload;
    const createdIds: number[] = [];

    beforeAll(async () => {
      payload = await getTestPayload();
    });

    afterAll(async () => {
      for (const id of createdIds) {
        await payload.delete({
          collection: "components",
          id,
          overrideAccess: true,
        });
      }
    });

    it("rejects publishing a hero design that misses the required heading binding", async () => {
      const created = await payload.create({
        collection: "components",
        draft: true,
        data: {
          displayName: `Int invalid hero ${Date.now()}`,
          blockType: "hero",
        },
        overrideAccess: true,
      });
      createdIds.push(created.id as number);

      await expect(
        payload.update({
          collection: "components",
          id: created.id,
          data: { _status: "published" },
          draft: false,
          overrideAccess: true,
        }),
      ).rejects.toThrow(/required field "heading" is not bound/);
    });

    it("publishes a hero design with catalog-complete bindings", async () => {
      const created = await payload.create({
        collection: "components",
        draft: true,
        data: {
          displayName: `Int valid hero ${Date.now()}`,
          blockType: "hero",
          composition: seedHeroDesignComposition,
        },
        overrideAccess: true,
      });
      createdIds.push(created.id as number);

      const published = await payload.update({
        collection: "components",
        id: created.id,
        data: { _status: "published" },
        draft: false,
        overrideAccess: true,
      });
      expect(published._status).toBe("published");
    });

    it("allows publishing design-only components without binding validation", async () => {
      const created = await payload.create({
        collection: "components",
        draft: true,
        data: {
          displayName: `Int design-only ${Date.now()}`,
        },
        overrideAccess: true,
      });
      createdIds.push(created.id as number);

      const published = await payload.update({
        collection: "components",
        id: created.id,
        data: { _status: "published" },
        draft: false,
        overrideAccess: true,
      });
      expect(published._status).toBe("published");
    });
  });

  describe("admin create defaults (audit §1.7)", () => {
    it("creates a page template without a composition (defaults a valid shell)", async () => {
      const payload = await getTestPayload();
      const created = await payload.create({
        collection: "page-compositions",
        draft: true,
        data: { title: `Int empty template ${Date.now()}` },
        overrideAccess: true,
      });
      try {
        expect(created.composition).toBeTruthy();
        expect(
          PageCompositionSchema.safeParse(created.composition).success,
        ).toBe(true);
      } finally {
        await payload.delete({
          collection: "page-compositions",
          id: created.id,
          overrideAccess: true,
        });
      }
    });

    it("creates a component without a composition (defaults an empty shell)", async () => {
      const payload = await getTestPayload();
      const created = await payload.create({
        collection: "components",
        draft: true,
        data: { displayName: `Int empty component ${Date.now()}` },
        overrideAccess: true,
      });
      try {
        expect(
          PageCompositionSchema.safeParse(created.composition).success,
        ).toBe(true);
      } finally {
        await payload.delete({
          collection: "components",
          id: created.id,
          overrideAccess: true,
        });
      }
    });
  });

  describe("pages draft/publish semantics", () => {
    let payload: Payload;
    const slug = `int-blocks-page-${Date.now()}`;

    beforeAll(async () => {
      payload = await getTestPayload();
    });

    afterAll(async () => {
      await payload.delete({
        collection: "pages",
        where: { slug: { equals: slug } },
        overrideAccess: true,
      });
    });

    it("allows saving a draft page with no template and no blocks", async () => {
      const created = await payload.create({
        collection: "pages",
        draft: true,
        data: {
          title: "Int blocks page",
          slug,
          _status: "draft",
        },
        overrideAccess: true,
      });
      expect(created.id).toBeDefined();
    });

    it("rejects publishing a page with no template and no blocks", async () => {
      const found = await payload.find({
        collection: "pages",
        where: { slug: { equals: slug } },
        limit: 1,
        overrideAccess: true,
      });
      const id = found.docs[0]?.id;
      expect(id).toBeDefined();

      await expect(
        payload.update({
          collection: "pages",
          id: id as number,
          data: { _status: "published" },
          draft: false,
          overrideAccess: true,
        }),
      ).rejects.toThrow(/page template or at least one content block/);
    });
  });
});
