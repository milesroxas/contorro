import { getPayload } from "payload";

import config from "../../src/payload.config.js";

export const editorUser = {
  email: "editor-phase4-e2e@example.com",
  password: "test",
};

export const designerUser = {
  email: "designer-phase4-e2e@example.com",
  password: "test",
};

const minimalContracts = {
  propContract: { fields: {} },
  slotContract: { slots: {} },
};

const compositionWithText = {
  rootId: "stack-root",
  nodes: {
    "stack-root": {
      id: "stack-root",
      kind: "primitive" as const,
      definitionKey: "primitive.stack",
      parentId: null,
      childIds: ["text-1"],
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
      propValues: { content: "SeedText" },
    },
  },
  styleBindings: {},
};

export async function seedComposerPhase4(): Promise<{
  pageId: string;
  compositionId: string;
  visibleDefName: string;
  hiddenDefName: string;
}> {
  const payload = await getPayload({ config });

  await payload.delete({
    collection: "users",
    where: { email: { equals: editorUser.email } },
  });
  await payload.delete({
    collection: "users",
    where: { email: { equals: designerUser.email } },
  });

  await payload.create({
    collection: "users",
    data: { ...editorUser, role: "contentEditor" },
  });
  await payload.create({
    collection: "users",
    data: { ...designerUser, role: "designer" },
  });

  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: "composer-e2e-comp" } },
  });
  await payload.delete({
    collection: "templates",
    where: { slug: { equals: "composer-e2e-template" } },
  });
  await payload.delete({
    collection: "pages",
    where: { slug: { equals: "composer-e2e-page" } },
  });
  await payload.delete({
    collection: "component-definitions",
    where: { key: { equals: "e2e.catalog.visible" } },
  });
  await payload.delete({
    collection: "component-definitions",
    where: { key: { equals: "e2e.catalog.hidden" } },
  });

  const visibleDef = await payload.create({
    collection: "component-definitions",
    data: {
      key: "e2e.catalog.visible",
      displayName: "E2E Visible Catalog Item",
      visibleInEditorCatalog: true,
      ...minimalContracts,
    },
    overrideAccess: true,
  });

  await payload.create({
    collection: "component-definitions",
    data: {
      key: "e2e.catalog.hidden",
      displayName: "E2E Hidden Catalog Item",
      visibleInEditorCatalog: false,
      ...minimalContracts,
    },
    overrideAccess: true,
  });

  const comp = await payload.create({
    collection: "page-compositions",
    data: {
      title: "Composer E2E composition",
      slug: "composer-e2e-comp",
      composition: compositionWithText,
    },
    draft: true,
    overrideAccess: true,
  });

  const template = await payload.create({
    collection: "templates",
    data: {
      title: "Composer E2E template",
      slug: "composer-e2e-template",
      description: "Seeded for Phase 4 E2E",
      sourceComposition: comp.id,
    },
    draft: true,
    overrideAccess: true,
  });

  await payload.update({
    collection: "templates",
    id: template.id,
    data: {},
    draft: false,
    overrideAccess: true,
  });

  const page = await payload.create({
    collection: "pages",
    data: {
      title: "Composer E2E Page",
      slug: "composer-e2e-page",
      pageComposition: comp.id,
    },
    draft: true,
    overrideAccess: true,
  });

  return {
    pageId: String(page.id),
    compositionId: String(comp.id),
    visibleDefName: "E2E Visible Catalog Item",
    hiddenDefName: "E2E Hidden Catalog Item",
  };
}

export async function cleanupComposerPhase4(): Promise<void> {
  const payload = await getPayload({ config });
  await payload.delete({
    collection: "pages",
    where: { slug: { equals: "composer-e2e-page" } },
  });
  await payload.delete({
    collection: "templates",
    where: { slug: { equals: "composer-e2e-template" } },
  });
  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: "composer-e2e-comp" } },
  });
  await payload.delete({
    collection: "users",
    where: { email: { equals: editorUser.email } },
  });
  await payload.delete({
    collection: "users",
    where: { email: { equals: designerUser.email } },
  });
  await payload.delete({
    collection: "component-definitions",
    where: { key: { equals: "e2e.catalog.visible" } },
  });
  await payload.delete({
    collection: "component-definitions",
    where: { key: { equals: "e2e.catalog.hidden" } },
  });
}
