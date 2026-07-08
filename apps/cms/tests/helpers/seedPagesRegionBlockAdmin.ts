import {
  buildSeedPageTemplateComposition,
  seedHeroDesignComposition,
} from "../../src/seeds/seed-content-fixtures.js";
import { getTestPayload } from "./getTestPayload.js";

/** Admin E2E: pages edit view shows native block fields for blocks in layout regions. */
export const E2E_REGION_ADMIN_PAGE_SLUG = "e2e-region-block-admin";
export const E2E_REGION_PC_SLUG = "e2e-region-block-pc";
export const E2E_REGION_COMPONENT_KEY = "e2e-region-block-design";
export const E2E_REGION_BLOCK_HEADING = "E2E block heading seed";

const pageTemplateComposition = buildSeedPageTemplateComposition();

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

  const design = await payload.create({
    collection: "components",
    draft: true,
    data: {
      key: E2E_REGION_COMPONENT_KEY,
      displayName: "E2E region hero design",
      blockType: "hero",
      composition: seedHeroDesignComposition,
    },
    overrideAccess: true,
  });
  await payload.update({
    collection: "components",
    id: design.id,
    data: { _status: "published" },
    draft: false,
    overrideAccess: true,
  });

  const pc = await payload.create({
    collection: "page-compositions",
    data: {
      title: "E2E region page template",
      slug: E2E_REGION_PC_SLUG,
      composition: pageTemplateComposition,
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
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              blockType: "hero",
              design: design.id,
              heading: E2E_REGION_BLOCK_HEADING,
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
