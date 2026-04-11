import { getPayload } from "payload";
import config from "../../src/payload.config.js";

export const designerUser = {
  email: "designer-e2e@example.com",
  password: "test",
};

const emptyStackComposition = {
  rootId: "stack-root",
  nodes: {
    "stack-root": {
      id: "stack-root",
      kind: "primitive" as const,
      definitionKey: "primitive.stack",
      parentId: null,
      childIds: [],
      propValues: {
        direction: "column",
        gap: "8px",
        align: "stretch",
        justify: "flex-start",
      },
    },
  },
  styleBindings: {},
};

export async function seedDesignerAndComposition(): Promise<{
  compositionId: string;
}> {
  const payload = await getPayload({ config });

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
      composition: emptyStackComposition,
    },
    draft: true,
  });

  return { compositionId: String(doc.id) };
}

export async function cleanupBuilderE2e(): Promise<void> {
  const payload = await getPayload({ config });
  await payload.delete({
    collection: "users",
    where: { email: { equals: designerUser.email } },
  });
  await payload.delete({
    collection: "page-compositions",
    where: { slug: { equals: "builder-e2e" } },
  });
}
