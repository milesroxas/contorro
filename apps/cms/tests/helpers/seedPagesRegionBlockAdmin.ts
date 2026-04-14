import { getTestPayload } from "./getTestPayload.js";

/** Admin E2E: pages edit view shows block CMS fields for components in layout regions. */
export const E2E_REGION_ADMIN_PAGE_SLUG = "e2e-region-block-admin";
export const E2E_REGION_PC_SLUG = "e2e-region-block-pc";
export const E2E_REGION_COMPONENT_KEY = "e2e-region-block-cm";

/** Matches `seedComposition` in `src/seeds/index.ts` (one `main` layout slot + template hero field). */
const pageTemplateComposition = {
  rootId: "stack-root",
  nodes: {
    "stack-root": {
      id: "stack-root",
      kind: "primitive" as const,
      definitionKey: "primitive.stack",
      parentId: null,
      childIds: ["text-1", "text-hero", "slot-main"],
      propValues: {
        direction: "column",
        gap: "8px",
        align: "stretch",
        justify: "flex-start",
      },
    },
    "text-1": {
      id: "text-1",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "stack-root",
      childIds: [],
      propValues: { content: "E2E page template." },
    },
    "text-hero": {
      id: "text-hero",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "stack-root",
      childIds: [],
      propValues: { content: "" },
      contentBinding: {
        source: "editor" as const,
        key: "hero-headline",
        editorField: {
          name: "hero-headline",
          type: "text" as const,
          required: true,
          label: "Hero headline",
        },
      },
    },
    "slot-main": {
      id: "slot-main",
      kind: "slot" as const,
      definitionKey: "primitive.slot",
      parentId: "stack-root",
      childIds: [],
      propValues: { slotId: "main" },
    },
  },
  styleBindings: {},
};

const blockEditorManifest = {
  editorFields: [
    {
      name: "headline",
      type: "text" as const,
      required: true,
      label: "Headline",
    },
  ],
};

const blockComposition = {
  rootId: "card-root",
  nodes: {
    "card-root": {
      id: "card-root",
      kind: "primitive" as const,
      definitionKey: "primitive.stack",
      parentId: null,
      childIds: ["card-text"],
      propValues: {
        direction: "column",
        gap: "8px",
        align: "stretch",
        justify: "flex-start",
      },
    },
    "card-text": {
      id: "card-text",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "card-root",
      childIds: [],
      propValues: { content: "" },
      contentBinding: {
        source: "editor" as const,
        key: "headline",
        editorField: {
          name: "headline",
          type: "text" as const,
          required: true,
          label: "Headline",
        },
      },
    },
  },
  styleBindings: {},
};

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
      editorFields: blockEditorManifest,
      composition: blockComposition,
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
