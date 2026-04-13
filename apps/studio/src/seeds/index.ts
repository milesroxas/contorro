import { deleteBuilderCompositionBySlug } from "@repo/infrastructure-payload-config";
import { getPayload } from "payload";

import config from "../payload.config.js";

/** Stable identifiers — re-run deletes and recreates these documents. */
export const SEED_PAGE_COMPOSITION_SLUG = "seed-composition";
export const SEED_PAGE_SLUG = "seed-page";
export const SEED_TOKEN_SCOPE_KEY = "seed-tokens";

export const SEED_PAGE_DESIGNER_SLUG = "seed-designer-page";

const SEED_COMPONENT_KEYS = [
  "primitive.stack",
  "primitive.text",
  "primitive.slot",
  "seed-card-designer-block-demo",
] as const;

const seedPassword = process.env.SEED_PASSWORD ?? "test";

export const SEED_USERS = {
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

const stackDefinition = {
  propContract: {
    fields: {
      direction: { valueType: "string" as const },
      gap: { valueType: "length" as const },
      align: { valueType: "string" as const },
      justify: { valueType: "string" as const },
    },
  },
  editorFields: { editorFields: [] },
};

const textDefinition = {
  propContract: {
    fields: {
      content: { valueType: "string" as const },
    },
  },
  editorFields: { editorFields: [] },
};

const slotDefinition = {
  propContract: {
    fields: {
      slotId: { valueType: "string" as const },
    },
  },
  editorFields: { editorFields: [] },
};

const seedCardEditorFieldsManifest = {
  editorFields: [
    {
      name: "headline",
      type: "text" as const,
      required: true,
      label: "Headline",
    },
  ],
};

const seedCardComposition = {
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

/**
 * Designer block (seed card demo): `propContract.fields` is intentionally empty — there are no
 * block-level prop keys in the PropContract sense; layout/text defaults live on nodes in
 * `composition`. What editors fill in Payload are **CMS editor fields** (`editorFields` +
 * `contentBinding.source === "editor"`), surfaced as `editorFieldValues` — not
 * `propContract`. Compare `stackDefinition` / `textDefinition` for non-empty primitive
 * `propContract` (library / tooling).
 */
const cardDefinition = {
  propContract: { fields: {} },
  editorFields: seedCardEditorFieldsManifest,
  composition: seedCardComposition,
};

/**
 * Page template tree for builder/admin: stack + inline text + two layout slots (page blocks) + CMS text.
 * Editor fields must use `contentBinding.source === "editor"` with `key === editorField.name`.
 * Page blocks live under `contentSlots[].blocks` keyed by `slotId` matching `primitive.slot` `propValues.slotId`.
 */
const seedComposition = {
  rootId: "stack-root",
  nodes: {
    "stack-root": {
      id: "stack-root",
      kind: "primitive" as const,
      definitionKey: "primitive.stack",
      parentId: null,
      childIds: ["text-1", "text-hero", "slot-main", "slot-secondary"],
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
      propValues: { content: "Hello from the seed page template." },
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
          description:
            "Filled via Pages → Template CMS fields (maps to this page template).",
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
    "slot-secondary": {
      id: "slot-secondary",
      kind: "slot" as const,
      definitionKey: "primitive.slot",
      parentId: "stack-root",
      childIds: [],
      propValues: { slotId: "slot2" },
    },
  },
  styleBindings: {},
};

const seedPageContentSlots = [
  {
    slotId: "main",
    blocks: [
      {
        componentDefinition: null as number | null,
        editorFieldValues: {
          headline: "Main slot seeded block headline.",
        },
      },
    ],
  },
  {
    slotId: "slot2",
    blocks: [
      {
        componentDefinition: null as number | null,
        editorFieldValues: {
          headline: "Slot2 seeded block headline.",
        },
      },
    ],
  },
];

const seedDesignerPageContentSlots = [
  {
    slotId: "main",
    blocks: [
      {
        componentDefinition: null as number | null,
        editorFieldValues: { headline: "Designer page main slot headline." },
      },
    ],
  },
  {
    slotId: "slot2",
    blocks: [
      {
        componentDefinition: null as number | null,
        editorFieldValues: {
          headline: "Designer page slot2 headline.",
        },
      },
    ],
  },
];

async function seed(): Promise<void> {
  const payload = await getPayload({ config });

  try {
    await payload.updateGlobal({
      slug: "design-system-settings",
      data: {
        defaultTokenSet: null,
        activeBrandKey: "",
      },
      overrideAccess: true,
    });

    await payload.delete({
      collection: "pages",
      where: { slug: { equals: SEED_PAGE_SLUG } },
      overrideAccess: true,
    });
    await payload.delete({
      collection: "pages",
      where: { slug: { equals: SEED_PAGE_DESIGNER_SLUG } },
      overrideAccess: true,
    });
    await payload.delete({
      collection: "page-compositions",
      where: { slug: { equals: SEED_PAGE_COMPOSITION_SLUG } },
      overrideAccess: true,
    });
    await deleteBuilderCompositionBySlug(SEED_PAGE_COMPOSITION_SLUG);

    for (const key of SEED_COMPONENT_KEYS) {
      await payload.delete({
        collection: "components",
        where: { key: { equals: key } },
        overrideAccess: true,
      });
    }

    await payload.delete({
      collection: "design-token-sets",
      where: { scopeKey: { equals: SEED_TOKEN_SCOPE_KEY } },
      overrideAccess: true,
    });

    for (const u of Object.values(SEED_USERS)) {
      await payload.delete({
        collection: "users",
        where: { email: { equals: u.email } },
        overrideAccess: true,
      });
    }

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

    const tokenSet = await payload.create({
      collection: "design-token-sets",
      data: {
        title: "Seed design tokens",
        scopeKey: SEED_TOKEN_SCOPE_KEY,
        tokens: [
          {
            key: "color.surface.primary",
            category: "color",
            resolvedValue: "#0f172a",
          },
          {
            key: "color.text.primary",
            category: "color",
            resolvedValue: "#f8fafc",
          },
          {
            key: "space.scale.2",
            category: "space",
            resolvedValue: "8px",
          },
        ],
        _status: "draft",
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "design-token-sets",
      id: tokenSet.id,
      data: {},
      draft: false,
      overrideAccess: true,
    });

    await payload.updateGlobal({
      slug: "design-system-settings",
      data: {
        defaultTokenSet: tokenSet.id,
        activeBrandKey: SEED_TOKEN_SCOPE_KEY,
      },
      overrideAccess: true,
    });

    const stackRow = await payload.create({
      collection: "components",
      draft: true,
      data: {
        key: "primitive.stack",
        displayName: "Stack (primitive)",
        ...stackDefinition,
      },
      overrideAccess: true,
    });
    await payload.update({
      collection: "components",
      id: stackRow.id,
      data: {},
      draft: false,
      overrideAccess: true,
    });

    const textRow = await payload.create({
      collection: "components",
      draft: true,
      data: {
        key: "primitive.text",
        displayName: "Text (primitive)",
        ...textDefinition,
      },
      overrideAccess: true,
    });
    await payload.update({
      collection: "components",
      id: textRow.id,
      data: {},
      draft: false,
      overrideAccess: true,
    });

    const slotRow = await payload.create({
      collection: "components",
      draft: true,
      data: {
        key: "primitive.slot",
        displayName: "Slot (primitive)",
        ...slotDefinition,
      },
      overrideAccess: true,
    });
    await payload.update({
      collection: "components",
      id: slotRow.id,
      data: {},
      draft: false,
      overrideAccess: true,
    });

    const cardCreated = await payload.create({
      collection: "components",
      data: {
        displayName: "Seed Card (designer block demo)",
        ...cardDefinition,
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "components",
      id: cardCreated.id,
      data: {},
      draft: false,
      overrideAccess: true,
    });

    const pageContentSlots = seedPageContentSlots.map((row) => ({
      ...row,
      blocks: row.blocks.map((block) => ({
        ...block,
        componentDefinition: cardCreated.id,
      })),
    }));
    const designerPageContentSlots = seedDesignerPageContentSlots.map(
      (row) => ({
        ...row,
        blocks: row.blocks.map((block) => ({
          ...block,
          componentDefinition: cardCreated.id,
        })),
      }),
    );

    const composition = await payload.create({
      collection: "page-compositions",
      data: {
        title: "Seed page template",
        slug: SEED_PAGE_COMPOSITION_SLUG,
        composition: seedComposition,
        catalogReviewStatus: "approved",
        catalogSubmittedAt: "2026-04-01T12:00:00.000Z",
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "page-compositions",
      id: composition.id,
      data: {},
      draft: false,
      overrideAccess: true,
    });

    const page = await payload.create({
      collection: "pages",
      data: {
        title: "Seed starter page",
        slug: SEED_PAGE_SLUG,
        pageComposition: composition.id,
        templateEditorFields: {
          "hero-headline":
            "Welcome — this page uses the seed template’s hero field.",
        },
        contentSlots: pageContentSlots,
      },
      draft: true,
      overrideAccess: true,
    });

    const designerPage = await payload.create({
      collection: "pages",
      data: {
        title: "Seed designer page",
        slug: SEED_PAGE_DESIGNER_SLUG,
        contentSlots: designerPageContentSlots,
      },
      draft: true,
      overrideAccess: true,
    });
    const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );

    const compositionId = String(composition.id);

    console.log("\n[seed] Done.\n");
    console.log(
      `  Page template:   ${SEED_PAGE_COMPOSITION_SLUG} (id: ${compositionId})`,
    );
    console.log(
      `  Seed page:       ${SEED_PAGE_SLUG} (template hero field + seed card blocks in main + slot2)`,
    );
    console.log(
      `  Designer page:   ${SEED_PAGE_DESIGNER_SLUG} (blocks only, no template)`,
    );
    console.log(`  Token set:         ${SEED_TOKEN_SCOPE_KEY}`);
    console.log(
      "  Design system:   default token set and active brand key configured",
    );
    console.log(
      "  Library:         published components with a template appear in the block picker",
    );
    console.log(`\n  Log in (all use password: ${seedPassword}):`);
    for (const [label, u] of Object.entries(SEED_USERS)) {
      console.log(`    ${label}: ${u.email}`);
    }
    console.log(
      `\n  Builder:  ${base}/admin/builder?composition=${compositionId}`,
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
