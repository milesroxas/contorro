import {
  headlineCardComposition,
  headlineCardEditorFields,
} from "../../src/seeds/seed-content-fixtures.js";
import { getTestPayload } from "./getTestPayload.js";

/** Stable slugs / keys for `bridge-designer-public.e2e.spec.ts`. */
export const BRIDGE_E2E_PAGE_SLUG = "e2e-bridge-public";
export const BRIDGE_E2E_COMPONENT_KEY = "e2e-bridge-card";

/**
 * Seeds a published page whose only body is a designer `content` array row with editor-field
 * substitution (Section D.5 — public render path).
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

  const def = await payload.create({
    collection: "components",
    draft: true,
    data: {
      displayName: "E2E bridge card",
      propContract: { fields: {} },
      editorFields: headlineCardEditorFields,
      composition: headlineCardComposition,
    },
    overrideAccess: true,
  });

  await payload.update({
    collection: "components",
    id: def.id,
    data: { _status: "published" },
    draft: false,
    overrideAccess: true,
  });

  const publishedComponent = await payload.findByID({
    collection: "components",
    id: def.id,
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
              componentDefinition: publishedComponent.id,
              editorFieldValues: { headline: "Hello World" },
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
