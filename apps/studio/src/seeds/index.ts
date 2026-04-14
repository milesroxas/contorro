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
        activeColorMode: "light",
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
    for (const key of SEED_COMPONENT_KEYS) {
      await payload.delete({
        collection: "components",
        where: { key: { equals: key } },
        overrideAccess: true,
      });
    }

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

    const seedLightTokens = [
      {
        key: "color.background",
        category: "color",
        resolvedValue: "#fafafa",
      },
      {
        key: "color.foreground",
        category: "color",
        resolvedValue: "#111827",
      },
      {
        key: "color.card",
        category: "color",
        resolvedValue: "#ffffff",
      },
      {
        key: "color.card.foreground",
        category: "color",
        resolvedValue: "#0f172a",
      },
      {
        key: "color.popover",
        category: "color",
        resolvedValue: "#ffffff",
      },
      {
        key: "color.popover.foreground",
        category: "color",
        resolvedValue: "#020617",
      },
      {
        key: "color.primary",
        category: "color",
        resolvedValue: "#853c00",
      },
      {
        key: "color.primary.foreground",
        category: "color",
        resolvedValue: "#ffffff",
      },
      {
        key: "color.secondary",
        category: "color",
        resolvedValue: "#ededed",
      },
      {
        key: "color.secondary.foreground",
        category: "color",
        resolvedValue: "#082f49",
      },
      {
        key: "color.muted",
        category: "color",
        resolvedValue: "#f3f4f6",
      },
      {
        key: "color.muted.foreground",
        category: "color",
        resolvedValue: "#4b5563",
      },
      {
        key: "color.accent",
        category: "color",
        resolvedValue: "#f0f9ff",
      },
      {
        key: "color.accent.foreground",
        category: "color",
        resolvedValue: "#0275b1",
      },
      {
        key: "color.destructive",
        category: "color",
        resolvedValue: "#dc2626",
      },
      {
        key: "color.border",
        category: "color",
        resolvedValue: "#d1d5db",
      },
      {
        key: "color.input",
        category: "color",
        resolvedValue: "#d1d5db",
      },
      {
        key: "color.ring",
        category: "color",
        resolvedValue: "#9ca3af",
      },
      {
        key: "color.chart.1",
        category: "color",
        resolvedValue: "#60a5fa",
      },
      {
        key: "color.chart.2",
        category: "color",
        resolvedValue: "#34d399",
      },
      {
        key: "color.chart.3",
        category: "color",
        resolvedValue: "#f59e0b",
      },
      {
        key: "color.chart.4",
        category: "color",
        resolvedValue: "#f97316",
      },
      {
        key: "color.chart.5",
        category: "color",
        resolvedValue: "#ef4444",
      },
      {
        key: "color.sidebar",
        category: "color",
        resolvedValue: "#ffffff",
      },
      {
        key: "color.sidebar.foreground",
        category: "color",
        resolvedValue: "#111827",
      },
      {
        key: "color.sidebar.primary",
        category: "color",
        resolvedValue: "#853c00",
      },
      {
        key: "color.sidebar.primary.foreground",
        category: "color",
        resolvedValue: "#ffffff",
      },
      {
        key: "color.sidebar.accent",
        category: "color",
        resolvedValue: "#f3f4f6",
      },
      {
        key: "color.sidebar.accent.foreground",
        category: "color",
        resolvedValue: "#111827",
      },
      {
        key: "color.sidebar.border",
        category: "color",
        resolvedValue: "#d1d5db",
      },
      {
        key: "color.sidebar.ring",
        category: "color",
        resolvedValue: "#9ca3af",
      },
      {
        key: "radius.base",
        category: "radius",
        resolvedValue: "0.625rem",
      },
      {
        key: "typography.font.sans",
        category: "typography",
        resolvedValue:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      },
      {
        key: "typography.font.heading",
        category: "typography",
        resolvedValue:
          'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      },
      {
        key: "typography.font.mono",
        category: "typography",
        resolvedValue:
          'ui-monospace, "Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
    ] as const;
    const seedDarkValueOverrides: Record<string, string> = {
      "color.background": "#0b0f19",
      "color.foreground": "#e5e7eb",
      "color.card": "#111827",
      "color.card.foreground": "#f9fafb",
      "color.popover": "#111827",
      "color.popover.foreground": "#f9fafb",
      "color.secondary": "#1f2937",
      "color.secondary.foreground": "#e5e7eb",
      "color.muted": "#1f2937",
      "color.muted.foreground": "#9ca3af",
      "color.accent": "#1e3a8a",
      "color.accent.foreground": "#dbeafe",
      "color.border": "#374151",
      "color.input": "#374151",
      "color.sidebar": "#0f172a",
      "color.sidebar.foreground": "#f8fafc",
      "color.sidebar.accent": "#1f2937",
      "color.sidebar.accent.foreground": "#e5e7eb",
      "color.sidebar.border": "#334155",
    };
    const seedTokens = [
      ...seedLightTokens.map((token) => ({ ...token, mode: "light" as const })),
      ...seedLightTokens.map((token) => ({
        ...token,
        mode: "dark" as const,
        resolvedValue: seedDarkValueOverrides[token.key] ?? token.resolvedValue,
      })),
    ] as const;

    const existingTokenSets = await payload.find({
      collection: "design-token-sets",
      where: { scopeKey: { equals: SEED_TOKEN_SCOPE_KEY } },
      limit: 1,
      depth: 0,
      draft: false,
      overrideAccess: true,
    });

    const existingTokenSet = existingTokenSets.docs[0];
    const desiredKeys = new Set(seedTokens.map((token) => token.key));
    const existingKeys = new Set(
      (
        (existingTokenSet as { tokens?: Array<{ key?: string }> } | undefined)
          ?.tokens ?? []
      ).map((token) => token.key ?? ""),
    );
    const hasSameKeys =
      desiredKeys.size === existingKeys.size &&
      [...desiredKeys].every((key) => existingKeys.has(key));
    const existingPublished = Boolean(
      (existingTokenSet as { hasBeenPublished?: boolean } | undefined)
        ?.hasBeenPublished,
    );

    let tokenSet: { id: number };
    let seededScopeKey = SEED_TOKEN_SCOPE_KEY;
    if (!existingTokenSet) {
      tokenSet = await payload.create({
        collection: "design-token-sets",
        data: {
          title: "Seed design tokens",
          scopeKey: SEED_TOKEN_SCOPE_KEY,
          tokens: [...seedTokens],
          _status: "draft",
        },
        draft: true,
        overrideAccess: true,
      });
    } else if (existingPublished && !hasSameKeys) {
      seededScopeKey = `${SEED_TOKEN_SCOPE_KEY}-v${Date.now()}`;
      tokenSet = await payload.create({
        collection: "design-token-sets",
        data: {
          title: "Seed design tokens",
          scopeKey: seededScopeKey,
          tokens: [...seedTokens],
          _status: "draft",
        },
        draft: true,
        overrideAccess: true,
      });
    } else {
      tokenSet = await payload.update({
        collection: "design-token-sets",
        id: existingTokenSet.id,
        data: {
          title: "Seed design tokens",
          scopeKey: SEED_TOKEN_SCOPE_KEY,
          tokens: [...seedTokens],
          _status: "draft",
        },
        draft: true,
        overrideAccess: true,
      });
    }

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
        activeBrandKey: seededScopeKey,
        activeColorMode: "light",
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
    console.log(`  Token set:         ${seededScopeKey}`);
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
      `\n  Studio:   ${base}/admin/studio?composition=${compositionId}`,
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
