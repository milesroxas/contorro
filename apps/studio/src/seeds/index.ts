import { getPayload } from "payload";

import config from "../payload.config.js";

/** Stable slug — re-run replaces this document (id may change). */
export const SEED_PAGE_COMPOSITION_SLUG = "local-seed";

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

async function seed(): Promise<void> {
  const payload = await getPayload({ config });

  try {
    await payload.delete({
      collection: "page-compositions",
      where: { slug: { equals: SEED_PAGE_COMPOSITION_SLUG } },
    });

    const doc = await payload.create({
      collection: "page-compositions",
      data: {
        title: "Local seed (builder)",
        slug: SEED_PAGE_COMPOSITION_SLUG,
        composition: emptyStackComposition,
      },
      draft: true,
    });

    const id = String(doc.id);
    const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );

    console.log(
      `Seeded page-composition "${SEED_PAGE_COMPOSITION_SLUG}" (id: ${id})`,
    );
    console.log(`Builder: ${base}/admin/builder?composition=${id}`);
  } finally {
    await payload.destroy();
  }
}

await seed();
