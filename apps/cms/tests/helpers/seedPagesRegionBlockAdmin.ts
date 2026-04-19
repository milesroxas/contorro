import {
  buildSeedPageTemplateComposition,
  headlineCardComposition,
  headlineCardEditorFields,
} from "../../src/seeds/seed-content-fixtures.js";
import { getTestPayload } from "./getTestPayload.js";

/** Admin E2E: pages edit view shows block CMS fields for components in layout regions. */
export const E2E_REGION_ADMIN_PAGE_SLUG = "e2e-region-block-admin";
export const E2E_REGION_PC_SLUG = "e2e-region-block-pc";
export const E2E_REGION_COMPONENT_KEY = "e2e-region-block-cm";

const pageTemplateComposition = buildSeedPageTemplateComposition({
  minimalHero: true,
  heroHeadlineDescription: false,
});

export async function seedPagesRegionBlockAdminFixture(): Promise<{
  pageId: number;
}> {
  const payload = await getTestPayload();

  await payload.delete({
    collection: "pages",
    where: { slug: { equals: E2E_REGION_ADMIN_PAGE_SLUG } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: E2E_REGION_PC_SLUG } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "components",
    where: { key: { equals: E2E_REGION_COMPONENT_KEY } },
    overrideAccess: true,
  });

  const block = await payload.create({
    collection: "components",
    draft: true,
    data: {
      key: E2E_REGION_COMPONENT_KEY,
      displayName: "E2E region block",
      propContract: { fields: {} },
      editorFields: headlineCardEditorFields,
      composition: headlineCardComposition,
    },
    overrideAccess: true,
  });
  await payload.update({
    collection: "components",
    id: block.id,
    data: {},
    draft: false,
    overrideAccess: true,
  });

  const pc = await payload.create({
    collection: "page-compositions",
    data: {
      title: "E2E region page template",
      slug: E2E_REGION_PC_SLUG,
      composition: pageTemplateComposition,
      catalogReviewStatus: "approved",
      catalogSubmittedAt: "2026-04-01T12:00:00.000Z",
    },
    draft: true,
    overrideAccess: true,
  });
  await payload.update({
    collection: "page-compositions",
    id: pc.id,
    data: {},
    draft: false,
    overrideAccess: true,
  });

  const page = await payload.create({
    collection: "pages",
    data: {
      title: "E2E region admin page",
      slug: E2E_REGION_ADMIN_PAGE_SLUG,
      pageComposition: pc.id,
      templateEditorFields: {
        "hero-headline": "Template hero for E2E",
      },
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              componentDefinition: block.id,
              editorFieldValues: { headline: "E2E block headline seed" },
            },
          ],
        },
      ],
    },
    draft: true,
    overrideAccess: true,
  });

  return { pageId: page.id as number };
}

export async function cleanupPagesRegionBlockAdmin(): Promise<void> {
  const payload = await getTestPayload();
  await payload.delete({
    collection: "pages",
    where: { slug: { equals: E2E_REGION_ADMIN_PAGE_SLUG } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: E2E_REGION_PC_SLUG } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "components",
    where: { key: { equals: E2E_REGION_COMPONENT_KEY } },
    overrideAccess: true,
  });
}
