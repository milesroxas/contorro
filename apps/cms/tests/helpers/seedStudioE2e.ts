import { getTestPayload } from "./getTestPayload.js";

export const designerUser = {
  email: "designer-e2e@example.com",
  password: "test",
};

const emptyComposition = {
  rootId: "root",
  nodes: {
    root: {
      id: "root",
      kind: "primitive" as const,
      definitionKey: "primitive.box",
      parentId: null,
      childIds: [],
      propValues: { tag: "div" },
    },
  },
  styleBindings: {},
};

export async function seedDesignerAndComposition(): Promise<{
  compositionId: string;
}> {
  const payload = await getTestPayload();

  await payload.delete({
    collection: "users",
    where: { email: { equals: designerUser.email } },
  });

  await payload.create({
    collection: "users",
    data: {
      ...designerUser,
      role: "designer",
    },
  });

  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: "builder-e2e" } },
  });

  const doc = await payload.create({
    collection: "page-compositions",
    data: {
      title: "Builder E2E",
      slug: "builder-e2e",
      composition: emptyComposition,
    },
    draft: true,
  });

  return { compositionId: String(doc.id) };
}

export async function cleanupBuilderE2e(): Promise<void> {
  const payload = await getTestPayload();
  await payload.delete({
    collection: "users",
    where: { email: { equals: designerUser.email } },
  });
  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: "builder-e2e" } },
  });
}
