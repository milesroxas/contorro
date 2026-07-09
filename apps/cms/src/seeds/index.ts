import { fileURLToPath } from "node:url";
import {
  getPayload,
  type Payload,
  type RequiredDataFromCollectionSlug,
} from "payload";

import config from "../payload.config.js";

import { seedDesignSystemTokens } from "./design-system-seed-shared.js";
import {
  buildSeedPageTemplateComposition,
  buildSeedPageTemplateWithLibraryComposition,
  lexicalRichText,
  SEED_CONTENT_DESIGN_COMPONENT_KEY,
  SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
  SEED_CTA_DESIGN_COMPONENT_KEY,
  SEED_FEATURE_DESIGN_COMPONENT_KEY,
  SEED_HERO_DESIGN_COMPONENT_KEY,
  SEED_PRIMARY_BUTTON_COMPONENT_KEY,
  seedContentDesignComposition,
  seedContentHighlightComposition,
  seedCtaDesignComposition,
  seedFeatureDesignComposition,
  seedHeroDesignComposition,
  seedPrimaryButtonComposition,
} from "./seed-content-fixtures.js";

/** Stable identifiers — re-run deletes and recreates these documents. */
const SEED_PAGE_COMPOSITION_SLUG = "seed-composition";
/** Template that embeds design-only library parts via `primitive.libraryComponent`. */
const SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG =
  "seed-composition-with-library";
const SEED_PAGE_SLUG = "seed-page";
const SEED_PAGE_WITH_LIBRARY_SLUG = "seed-page-with-library-template";

export { SEED_TOKEN_SCOPE_KEY } from "./design-system-seed-shared.js";

const SEED_PAGE_DESIGNER_SLUG = "seed-designer-page";

const SEED_COMPONENT_KEYS = [
  "primitive.box",
  "primitive.text",
  "primitive.slot",
  "primitive.section",
  "primitive.heading",
  "primitive.button",
  "primitive.image",
  SEED_HERO_DESIGN_COMPONENT_KEY,
  SEED_FEATURE_DESIGN_COMPONENT_KEY,
  SEED_CTA_DESIGN_COMPONENT_KEY,
  SEED_CONTENT_DESIGN_COMPONENT_KEY,
  SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
  SEED_PRIMARY_BUTTON_COMPONENT_KEY,
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

/**
 * Seeding is destructive (deletes and recreates seed-slug documents) and
 * creates known-email users. Guard against accidental production runs.
 */
function resolveSeedPassword(): string {
  const looksLikeProduction =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production" ||
    /neon\.tech|supabase\.co|amazonaws\.com/i.test(
      process.env.DATABASE_URL ?? "",
    );

  if (looksLikeProduction && process.env.SEED_ALLOW_PRODUCTION !== "true") {
    throw new Error(
      "Refusing to seed: production environment detected. Set SEED_ALLOW_PRODUCTION=true and a strong SEED_PASSWORD to override.",
    );
  }

  const password = process.env.SEED_PASSWORD;
  if (looksLikeProduction) {
    if (!password || password.length < 16) {
      throw new Error(
        "Refusing to seed production with a missing or weak SEED_PASSWORD (min 16 chars).",
      );
    }
    return password;
  }
  return password ?? "test";
}

const seedPassword = resolveSeedPassword();

const SEED_USERS = {
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

async function createAndPublishSeedComponent(
  payload: Payload,
  data: RequiredDataFromCollectionSlug<"components">,
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

async function deleteSeedDocuments(payload: Payload): Promise<void> {
  for (const slug of [
    SEED_PAGE_SLUG,
    SEED_PAGE_DESIGNER_SLUG,
    SEED_PAGE_WITH_LIBRARY_SLUG,
  ]) {
    await payload.delete({
      collection: "pages",
      where: { slug: { equals: slug } },
      overrideAccess: true,
    });
  }
  for (const slug of [
    SEED_PAGE_COMPOSITION_SLUG,
    SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG,
  ]) {
    await payload.delete({
      collection: "page-compositions",
      where: { slug: { equals: slug } },
      overrideAccess: true,
    });
  }
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
}

async function createAndPublishPageComposition(
  payload: Payload,
  data: RequiredDataFromCollectionSlug<"page-compositions">,
) {
  const created = await payload.create({
    collection: "page-compositions",
    data,
    draft: true,
    overrideAccess: true,
  });
  await payload.update({
    collection: "page-compositions",
    id: created.id,
    data: { _status: "published" },
    draft: false,
    overrideAccess: true,
  });
  return created;
}

async function createAndPublishPage(
  payload: Payload,
  data: RequiredDataFromCollectionSlug<"pages">,
) {
  const created = await payload.create({
    collection: "pages",
    data,
    draft: true,
    overrideAccess: true,
  });
  await payload.update({
    collection: "pages",
    id: created.id,
    data: { _status: "published" },
    draft: false,
    overrideAccess: true,
  });
  return created;
}

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

    await deleteSeedDocuments(payload);

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
    const seedMediaIds = {
      landscape: asNumericMediaId(seedLandscapeMedia.id),
      square: asNumericMediaId(
        (
          await payload.create({
            collection: "media",
            data: { alt: SEED_MEDIA_ASSETS.square.alt },
            filePath: SEED_MEDIA_ASSETS.square.filePath,
            overrideAccess: true,
          })
        ).id,
      ),
    } as const;

    const { seededScopeKey } = await seedDesignSystemTokens(payload);

    // Block designs (blockType set) — selectable in the page block picker.
    const heroDesign = await createAndPublishSeedComponent(payload, {
      displayName: "Seed hero design",
      key: SEED_HERO_DESIGN_COMPONENT_KEY,
      blockType: "hero",
      composition: seedHeroDesignComposition,
    });
    const featureDesign = await createAndPublishSeedComponent(payload, {
      displayName: "Seed feature design",
      key: SEED_FEATURE_DESIGN_COMPONENT_KEY,
      blockType: "feature",
      composition: seedFeatureDesignComposition,
    });
    const ctaDesign = await createAndPublishSeedComponent(payload, {
      displayName: "Seed CTA design",
      key: SEED_CTA_DESIGN_COMPONENT_KEY,
      blockType: "cta",
      composition: seedCtaDesignComposition,
    });
    const contentDesign = await createAndPublishSeedComponent(payload, {
      displayName: "Seed content design",
      key: SEED_CONTENT_DESIGN_COMPONENT_KEY,
      blockType: "content",
      composition: seedContentDesignComposition,
    });

    // Design-only library parts (no blockType) — embedded in templates.
    await createAndPublishSeedComponent(payload, {
      displayName: "Seed content highlight",
      key: SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY,
      composition: seedContentHighlightComposition,
    });
    await createAndPublishSeedComponent(payload, {
      displayName: "Seed primary button",
      key: SEED_PRIMARY_BUTTON_COMPONENT_KEY,
      composition: seedPrimaryButtonComposition,
    });

    const composition = await createAndPublishPageComposition(payload, {
      title: "Seed page template",
      slug: SEED_PAGE_COMPOSITION_SLUG,
      composition: buildSeedPageTemplateComposition(),
    });
    const compositionWithLibrary = await createAndPublishPageComposition(
      payload,
      {
        title: "Seed template (embedded library parts)",
        slug: SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG,
        composition: buildSeedPageTemplateWithLibraryComposition(),
      },
    );

    await createAndPublishPage(payload, {
      title: "Seed starter page",
      slug: SEED_PAGE_SLUG,
      pageComposition: composition.id,
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              blockType: "hero",
              design: heroDesign.id,
              heading: "Welcome — this hero block uses the seed hero design.",
              body: lexicalRichText(
                "Typed block content authored in /admin, rendered through the Studio-built design.",
              ),
              image: seedMediaIds.landscape,
              cta: {
                label: "Start designing",
                linkType: "url",
                url: "/studio",
                openInNewTab: false,
              },
            },
            {
              blockType: "feature",
              design: featureDesign.id,
              heading: "Everything your website launch needs",
              body: lexicalRichText(
                "Feature block seeded with typed values; the image field stays empty (optional).",
              ),
            },
            {
              blockType: "cta",
              design: ctaDesign.id,
              heading: "Ready to ship your next page?",
              body: lexicalRichText(
                "CTA block with a required button field bound to the design's primary button.",
              ),
              button: {
                label: "Book a demo",
                linkType: "url",
                url: "/contact",
                openInNewTab: false,
              },
            },
          ],
        },
      ],
    });

    await createAndPublishPage(payload, {
      title: "Seed designer page",
      slug: SEED_PAGE_DESIGNER_SLUG,
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              blockType: "content",
              design: contentDesign.id,
              body: lexicalRichText(
                "Blocks-only page: no template, a single content block renders standalone.",
              ),
            },
          ],
        },
      ],
    });

    await createAndPublishPage(payload, {
      title: "Seed page (template with embedded library parts)",
      slug: SEED_PAGE_WITH_LIBRARY_SLUG,
      pageComposition: compositionWithLibrary.id,
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              blockType: "content",
              design: contentDesign.id,
              body: lexicalRichText(
                "Main-region content block below the embedded design-only library parts.",
              ),
            },
          ],
        },
      ],
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
      `  Page template:   ${SEED_PAGE_COMPOSITION_WITH_LIBRARY_SLUG} (id: ${compositionWithLibraryId}) — embeds ${SEED_CONTENT_HIGHLIGHT_COMPONENT_KEY}, ${SEED_PRIMARY_BUTTON_COMPONENT_KEY}`,
    );
    console.log(
      `  Seed page:       ${SEED_PAGE_SLUG} (hero + feature + CTA blocks in main region)`,
    );
    console.log(
      `  Seed page:       ${SEED_PAGE_WITH_LIBRARY_SLUG} (template embeds design-only parts; content block in main)`,
    );
    console.log(
      `  Designer page:   ${SEED_PAGE_DESIGNER_SLUG} (blocks only, no template)`,
    );
    console.log(`  Token set:         ${seededScopeKey}`);
    console.log(
      "  Design system:   default token set and active brand key configured",
    );
    console.log(
      "  Media:           seeded placeholder uploads (16:9 + 1:1) for hero image",
    );
    console.log(
      `  Block designs:   hero (${heroDesign.id}), feature (${featureDesign.id}), cta (${ctaDesign.id}), content (${contentDesign.id})`,
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
