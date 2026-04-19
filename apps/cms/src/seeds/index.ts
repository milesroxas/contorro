import { fileURLToPath } from "node:url";
import { getPayload, type Payload } from "payload";

import config from "../payload.config.js";

import { seedDesignSystemTokens } from "./design-system-seed-shared.js";
import {
  buildSeedPageTemplateComposition,
  buildSeedPageTemplateWithLibraryComposition,
  headlineCardComposition,
  headlineCardEditorFields,
  SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
  SEED_CTA_SECTION_COMPONENT_KEY,
  SEED_FEATURE_GRID_SECTION_COMPONENT_KEY,
  SEED_HERO_SECTION_COMPONENT_KEY,
  SEED_PRIMARY_BUTTON_COMPONENT_KEY,
  seedCtaSectionComposition,
  seedFeatureGridSectionComposition,
  seedHeroSectionComposition,
  seedPrimaryButtonComposition,
  withLibraryEmbedHighlightEditorFieldValues,
} from "./seed-content-fixtures.js";

/** Stable identifiers — re-run deletes and recreates these documents. */
export const SEED_PAGE_COMPOSITION_SLUG = "seed-composition";
/** Template that embeds {@link SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY} via `primitive.libraryComponent`. */
export const SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG =
  "seed-composition-with-library";
export const SEED_PAGE_SLUG = "seed-page";
export const SEED_PAGE_WITH_LIBRARY_SLUG = "seed-page-with-library-template";

export { SEED_TOKEN_SCOPE_KEY } from "./design-system-seed-shared.js";

export const SEED_PAGE_DESIGNER_SLUG = "seed-designer-page";

const SEED_COMPONENT_KEYS = [
  "primitive.box",
  "primitive.text",
  "primitive.slot",
  "primitive.section",
  "primitive.heading",
  "primitive.button",
  "primitive.image",
  SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
  SEED_PRIMARY_BUTTON_COMPONENT_KEY,
  SEED_HERO_SECTION_COMPONENT_KEY,
  SEED_FEATURE_GRID_SECTION_COMPONENT_KEY,
  SEED_CTA_SECTION_COMPONENT_KEY,
] as const;

const SEED_MEDIA_ASSETS = {
  landscape: {
    alt: "Seed placeholder image (16:9)",
    filePath: fileURLToPath(
      new URL("./assets/placeholder/fpo-img-16-9.avif", import.meta.url),
    ),
  },
  square: {
    alt: "Seed placeholder image (1:1)",
    filePath: fileURLToPath(
      new URL("./assets/placeholder/fpo-img-1-1.avif", import.meta.url),
    ),
  },
} as const;

const seedPassword = process.env.SEED_PASSWORD ?? "test";

export const SEED_USERS = {
  admin: {
    email: "seed-admin@local.test",
    password: seedPassword,
    role: "admin" as const,
  },
  designer: {
    email: "seed-designer@local.test",
    password: seedPassword,
    role: "designer" as const,
  },
  editor: {
    email: "seed-editor@local.test",
    password: seedPassword,
    role: "contentEditor" as const,
  },
} as const;

function asNumericMediaId(id: unknown): number {
  if (typeof id === "number" && Number.isFinite(id)) {
    return id;
  }
  if (typeof id === "string" && /^\d+$/.test(id)) {
    return Number.parseInt(id, 10);
  }
  throw new Error(`Seed media id must be numeric, received "${String(id)}"`);
}

/**
 * Seeded library components are authored as realistic, website-ready blocks.
 * `propContract.fields` stays empty because structure and defaults live in `composition`.
 */
const cardDefinition = {
  propContract: { fields: {} },
  editorFields: headlineCardEditorFields,
  composition: headlineCardComposition,
};

const primaryButtonDefinition = {
  propContract: { fields: {} },
  editorFields: { editorFields: [] },
  composition: seedPrimaryButtonComposition,
};

const heroSectionDefinition = {
  propContract: { fields: {} },
  editorFields: { editorFields: [] },
  composition: seedHeroSectionComposition,
};

const featureGridSectionDefinition = {
  propContract: { fields: {} },
  editorFields: { editorFields: [] },
  composition: seedFeatureGridSectionComposition,
};

const ctaSectionDefinition = {
  propContract: { fields: {} },
  editorFields: { editorFields: [] },
  composition: seedCtaSectionComposition,
};

async function createAndPublishSeedComponent(
  payload: Payload,
  data: Record<string, unknown>,
) {
  const created = await payload.create({
    collection: "components",
    data,
    draft: true,
    overrideAccess: true,
  });
  await payload.update({
    collection: "components",
    id: created.id,
    data: { _status: "published" },
    draft: false,
    overrideAccess: true,
  });
  return created;
}

const seedComposition = buildSeedPageTemplateComposition();

const seedPageContentSlots = [
  {
    slotId: "main",
    blocks: [
      {
        componentDefinition: null as number | null,
        editorFieldValues: {
          headline:
            "Main region — this highlight block sits below the hero. Replace with your sections.",
          body: "Seeded content block with style bindings and media-backed image.",
          image: null as number | null,
        },
      },
    ],
  },
];

const seedDesignerPageContentSlots = [
  {
    slotId: "main",
    blocks: [
      {
        componentDefinition: null as number | null,
        editorFieldValues: {
          headline: "Designer-only page: main region highlight.",
          body: "Designer seed content with optional image editor field.",
          image: null as number | null,
        },
      },
    ],
  },
];

/** Main slot only; highlight already lives in the template via library embed. */
const seedLibraryTemplatePageContentSlots = [{ slotId: "main", blocks: [] }];

async function seed(): Promise<void> {
  const payload = await getPayload({ config });

  try {
    await payload.updateGlobal({
      slug: "design-system-settings",
      data: {
        defaultTokenSet: null,
        activeBrandKey: "",
        activeColorMode: "light",
      },
      overrideAccess: true,
    });

    await payload.delete({
      collection: "pages",
      where: { slug: { equals: SEED_PAGE_SLUG } },
      overrideAccess: true,
    });
    await payload.delete({
      collection: "pages",
      where: { slug: { equals: SEED_PAGE_DESIGNER_SLUG } },
      overrideAccess: true,
    });
    await payload.delete({
      collection: "pages",
      where: { slug: { equals: SEED_PAGE_WITH_LIBRARY_SLUG } },
      overrideAccess: true,
    });
    await payload.delete({
      collection: "page-compositions",
      where: { slug: { equals: SEED_PAGE_COMPOSITION_SLUG } },
      overrideAccess: true,
    });
    await payload.delete({
      collection: "page-compositions",
      where: { slug: { equals: SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG } },
      overrideAccess: true,
    });
    for (const key of SEED_COMPONENT_KEYS) {
      await payload.delete({
        collection: "components",
        where: { key: { equals: key } },
        overrideAccess: true,
      });
    }
    // Media: Local API uses `overrideAccess: true` (bootstrap; no session). REST `/api/media`
    // still enforces collection access (`authenticatedAccess` / delete rules) for browser uploads.
    for (const asset of Object.values(SEED_MEDIA_ASSETS)) {
      await payload.delete({
        collection: "media",
        where: { alt: { equals: asset.alt } },
        overrideAccess: true,
      });
    }

    for (const u of Object.values(SEED_USERS)) {
      await payload.delete({
        collection: "users",
        where: { email: { equals: u.email } },
        overrideAccess: true,
      });
    }

    for (const u of Object.values(SEED_USERS)) {
      await payload.create({
        collection: "users",
        data: {
          email: u.email,
          password: u.password,
          role: u.role,
        },
        overrideAccess: true,
      });
    }

    const seedLandscapeMedia = await payload.create({
      collection: "media",
      data: { alt: SEED_MEDIA_ASSETS.landscape.alt },
      filePath: SEED_MEDIA_ASSETS.landscape.filePath,
      overrideAccess: true,
    });
    const seedSquareMedia = await payload.create({
      collection: "media",
      data: { alt: SEED_MEDIA_ASSETS.square.alt },
      filePath: SEED_MEDIA_ASSETS.square.filePath,
      overrideAccess: true,
    });
    const seedMediaIds = {
      landscape: asNumericMediaId(seedLandscapeMedia.id),
      square: asNumericMediaId(seedSquareMedia.id),
    } as const;

    const seedCompositionWithLibrary =
      withLibraryEmbedHighlightEditorFieldValues(
        buildSeedPageTemplateWithLibraryComposition(),
        { image: seedMediaIds.landscape, heroImage: seedMediaIds.square },
      );

    const { seededScopeKey } = await seedDesignSystemTokens(payload);

    const highlightCreated = await createAndPublishSeedComponent(payload, {
      displayName: "Seed content highlight",
      ...cardDefinition,
    });
    await createAndPublishSeedComponent(payload, {
      displayName: "Seed primary button",
      ...primaryButtonDefinition,
    });
    await createAndPublishSeedComponent(payload, {
      displayName: "Seed hero section",
      ...heroSectionDefinition,
    });
    await createAndPublishSeedComponent(payload, {
      displayName: "Seed feature grid section",
      ...featureGridSectionDefinition,
    });
    await createAndPublishSeedComponent(payload, {
      displayName: "Seed CTA section",
      ...ctaSectionDefinition,
    });

    const pageContentSlots = seedPageContentSlots.map((row) => ({
      ...row,
      blocks: row.blocks.map((block) => ({
        ...block,
        componentDefinition: highlightCreated.id,
        editorFieldValues: {
          ...block.editorFieldValues,
          image: seedMediaIds.landscape,
        },
      })),
    }));
    const designerPageContentSlots = seedDesignerPageContentSlots.map(
      (row) => ({
        ...row,
        blocks: row.blocks.map((block) => ({
          ...block,
          componentDefinition: highlightCreated.id,
          editorFieldValues: {
            ...block.editorFieldValues,
            image: seedMediaIds.square,
          },
        })),
      }),
    );

    const composition = await payload.create({
      collection: "page-compositions",
      data: {
        title: "Seed page template",
        slug: SEED_PAGE_COMPOSITION_SLUG,
        composition: seedComposition,
        catalogReviewStatus: "approved",
        catalogSubmittedAt: "2026-04-01T12:00:00.000Z",
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "page-compositions",
      id: composition.id,
      data: { _status: "published" },
      draft: false,
      overrideAccess: true,
    });

    const compositionWithLibrary = await payload.create({
      collection: "page-compositions",
      data: {
        title: "Seed template (embedded library block)",
        slug: SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG,
        composition: seedCompositionWithLibrary,
        catalogReviewStatus: "approved",
        catalogSubmittedAt: "2026-04-01T12:00:00.000Z",
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "page-compositions",
      id: compositionWithLibrary.id,
      data: { _status: "published" },
      draft: false,
      overrideAccess: true,
    });

    const _page = await payload.create({
      collection: "pages",
      data: {
        title: "Seed starter page",
        slug: SEED_PAGE_SLUG,
        pageComposition: composition.id,
        templateEditorFields: {
          "hero-headline":
            "Welcome — this page uses the seed template’s hero field.",
          "hero-subhead":
            "Template CMS copy under the headline — edit in Pages or swap the template in Studio.",
        },
        contentSlots: pageContentSlots,
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "pages",
      id: _page.id,
      data: { _status: "published" },
      draft: false,
      overrideAccess: true,
    });

    const _designerPage = await payload.create({
      collection: "pages",
      data: {
        title: "Seed designer page",
        slug: SEED_PAGE_DESIGNER_SLUG,
        contentSlots: designerPageContentSlots,
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "pages",
      id: _designerPage.id,
      data: { _status: "published" },
      draft: false,
      overrideAccess: true,
    });

    const _pageWithLibraryTemplate = await payload.create({
      collection: "pages",
      data: {
        title: "Seed page (template with embedded library block)",
        slug: SEED_PAGE_WITH_LIBRARY_SLUG,
        pageComposition: compositionWithLibrary.id,
        templateEditorFields: {
          "hero-headline":
            "Embedded highlight template — hero is still template CMS.",
          "hero-subhead":
            "Seeded hero, feature grid, highlight, CTA, and primary button components are wired in this template.",
        },
        contentSlots: seedLibraryTemplatePageContentSlots,
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "pages",
      id: _pageWithLibraryTemplate.id,
      data: { _status: "published" },
      draft: false,
      overrideAccess: true,
    });
    const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );

    const compositionId = String(composition.id);
    const compositionWithLibraryId = String(compositionWithLibrary.id);

    console.log("\n[seed] Done.\n");
    console.log(
      `  Page template:   ${SEED_PAGE_COMPOSITION_SLUG} (id: ${compositionId})`,
    );
    console.log(
      `  Page template:   ${SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG} (id: ${compositionWithLibraryId}) — embeds ${SEED_HERO_SECTION_COMPONENT_KEY}, ${SEED_FEATURE_GRID_SECTION_COMPONENT_KEY}, ${SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY}, ${SEED_CTA_SECTION_COMPONENT_KEY}, ${SEED_PRIMARY_BUTTON_COMPONENT_KEY}`,
    );
    console.log(
      `  Seed page:       ${SEED_PAGE_SLUG} (hero + main slot with highlight block)`,
    );
    console.log(
      `  Seed page:       ${SEED_PAGE_WITH_LIBRARY_SLUG} (template embeds all seeded library components; empty main slot)`,
    );
    console.log(
      `  Designer page:   ${SEED_PAGE_DESIGNER_SLUG} (blocks only, no template)`,
    );
    console.log(`  Token set:         ${seededScopeKey}`);
    console.log(
      "  Design system:   default token set and active brand key configured",
    );
    console.log(
      "  Media:           seeded placeholder uploads (16:9 + 1:1) for image editor fields",
    );
    console.log(
      "  Library:         published components with a template appear in the block picker",
    );
    console.log(`\n  Log in (all use password: ${seedPassword}):`);
    for (const [label, u] of Object.entries(SEED_USERS)) {
      console.log(`    ${label}: ${u.email}`);
    }
    console.log(`\n  Studio:   ${base}/studio?composition=${compositionId}`);
    console.log(
      `  Studio:   ${base}/studio?composition=${compositionWithLibraryId}`,
    );
    console.log(
      `  Composer: ${base}/admin/collections/pages (seed page / template in admin)`,
    );
    console.log("");
  } finally {
    await payload.destroy();
  }
}

await seed();
