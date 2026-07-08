import {
  lexicalRichText,
  seedContentDesignComposition,
} from "../../src/seeds/seed-content-fixtures.js";
import { getTestPayload } from "./getTestPayload.js";

/** Stable slugs / keys for `bridge-designer-public.e2e.spec.ts`. */
export const BRIDGE_E2E_PAGE_SLUG = "e2e-bridge-public";
export const BRIDGE_E2E_COMPONENT_KEY = "e2e-bridge-content-design";
export const BRIDGE_E2E_BLOCK_TEXT = "Hello World";

/**
 * Seeds a published page whose only body is a native `content` block with a
 * published block design — covers the public blocks render path end to end.
 */
export async function seedBridgePublicPage(): Promise<void> {
  const payload = await getTestPayload();

  await payload.delete({
    collection: "pages",
    where: { slug: { equals: BRIDGE_E2E_PAGE_SLUG } },
    overrideAccess: true,
  });
  await payload.delete({
    collection: "components",
    where: { key: { equals: BRIDGE_E2E_COMPONENT_KEY } },
    overrideAccess: true,
  });

  const design = await payload.create({
    collection: "components",
    draft: true,
    data: {
      key: BRIDGE_E2E_COMPONENT_KEY,
      displayName: "E2E bridge content design",
      blockType: "content",
      composition: seedContentDesignComposition,
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

  await payload.create({
    collection: "pages",
    data: {
      title: "E2E bridge public",
      slug: BRIDGE_E2E_PAGE_SLUG,
      _status: "published",
      contentSlots: [
        {
          slotId: "main",
          blocks: [
            {
              blockType: "content",
              design: design.id,
              body: lexicalRichText(BRIDGE_E2E_BLOCK_TEXT),
            },
          ],
        },
      ],
    },
    draft: false,
    overrideAccess: true,
  });
}

export async function cleanupBridgeE2e(): Promise<void> {
  const payload = await getTestPayload();
  await payload.delete({
    collection: "pages",
    where: { slug: { equals: BRIDGE_E2E_PAGE_SLUG } },
    overrideAccess: true,
  });

  await payload.delete({
    collection: "components",
    where: { key: { equals: BRIDGE_E2E_COMPONENT_KEY } },
    overrideAccess: true,
  });
}
