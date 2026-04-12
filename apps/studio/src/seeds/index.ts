import { deleteBuilderCompositionBySlug } from "@repo/infrastructure-payload-config";
import { getPayload } from "payload";

import config from "../payload.config.js";

/** Stable identifiers — re-run deletes and recreates these documents. */
export const SEED_PAGE_COMPOSITION_SLUG = "local-seed";
export const SEED_PAGE_SLUG = "local-seed-page";
export const SEED_TOKEN_SCOPE_KEY = "local-seed";

/** `component-revisions` — stable labels for idempotent delete/recreate (gateway workflow; hidden in admin). */
export const SEED_REVISION_STACK_LABEL = "Local seed · Stack revision";
export const SEED_REVISION_TEXT_LABEL = "Local seed · Text revision";
export const SEED_PAGE_DESIGNER_SLUG = "local-seed-designer";

const SEED_COMPONENT_KEYS = [
  "primitive.stack",
  "primitive.text",
  "seed.card",
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
  slotContract: { slots: [] },
};

const textDefinition = {
  propContract: {
    fields: {
      content: { valueType: "string" as const },
    },
  },
  slotContract: { slots: [] },
};

const seedCardSlotContract = {
  slots: [
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
        source: "slot" as const,
        key: "headline",
        slot: {
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
 * Designer block (`seed.card`): `propContract.fields` is intentionally empty — there are no
 * block-level prop keys in the PropContract sense; layout/text defaults live on nodes in
 * `composition`. What editors fill in Payload is **slots** (`slotContract` + slot
 * bindings in the tree), surfaced as block `slotValues` / `SlotValuesInputs` — not
 * `propContract`. Compare `stackDefinition` / `textDefinition` for non-empty primitive
 * `propContract` (catalog / tooling).
 */
const cardDefinition = {
  propContract: { fields: {} },
  slotContract: seedCardSlotContract,
  composition: seedCardComposition,
};

/**
 * Page template tree for builder/admin: stack + inline text + one slot-driven text node.
 * Slots must use `contentBinding.source === "slot"` with `key === slot.name` (domain invariant).
 */
const seedComposition = {
  rootId: "stack-root",
  nodes: {
    "stack-root": {
      id: "stack-root",
      kind: "primitive" as const,
      definitionKey: "primitive.stack",
      parentId: null,
      childIds: ["text-1", "text-hero"],
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
      propValues: { content: "Hello from the local seed composition." },
    },
    "text-hero": {
      id: "text-hero",
      kind: "text" as const,
      definitionKey: "primitive.text",
      parentId: "stack-root",
      childIds: [],
      propValues: { content: "" },
      contentBinding: {
        source: "slot" as const,
        key: "hero-headline",
        slot: {
          name: "hero-headline",
          type: "text" as const,
          required: true,
          label: "Hero headline",
          description:
            "Filled via Pages → Template slots (maps to this page template).",
        },
      },
    },
  },
  styleBindings: {},
};

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

    await payload.delete({
      collection: "component-revisions",
      where: {
        or: [
          { label: { equals: SEED_REVISION_STACK_LABEL } },
          { label: { equals: SEED_REVISION_TEXT_LABEL } },
          { label: { equals: "Local seed · Card (published)" } },
        ],
      },
      overrideAccess: true,
    });

    for (const key of SEED_COMPONENT_KEYS) {
      await payload.delete({
        collection: "component-definitions",
        where: { key: { equals: key } },
        overrideAccess: true,
      });
    }

    const existingTokenSet = await payload.find({
      collection: "design-token-sets",
      where: { scopeKey: { equals: SEED_TOKEN_SCOPE_KEY } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const priorTokenSetId = existingTokenSet.docs[0]?.id;
    if (priorTokenSetId !== undefined) {
      await payload.delete({
        collection: "design-token-overrides",
        where: { tokenSet: { equals: priorTokenSetId } },
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
        title: "Local seed tokens",
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

    await payload.create({
      collection: "design-token-overrides",
      data: {
        tokenSet: tokenSet.id,
        tokenKey: "color.surface.primary",
        override: { hex: "#1e3a5f", alpha: 1 },
      },
      overrideAccess: true,
    });

    await payload.create({
      collection: "design-token-overrides",
      data: {
        tokenSet: tokenSet.id,
        tokenKey: "space.scale.2",
        override: { value: 12, unit: "px" },
      },
      overrideAccess: true,
    });

    const stackDef = await payload.create({
      collection: "component-definitions",
      data: {
        key: "primitive.stack",
        displayName: "Stack (primitive)",
        visibleInEditorCatalog: false,
        ...stackDefinition,
      },
      overrideAccess: true,
    });

    const textDef = await payload.create({
      collection: "component-definitions",
      data: {
        key: "primitive.text",
        displayName: "Text (primitive)",
        visibleInEditorCatalog: false,
        ...textDefinition,
      },
      overrideAccess: true,
    });

    const cardDef = await payload.create({
      collection: "component-definitions",
      data: {
        key: "seed.card",
        displayName: "Seed Card (designer block demo)",
        visibleInEditorCatalog: true,
        ...cardDefinition,
      },
      overrideAccess: true,
    });

    await payload.create({
      collection: "component-revisions",
      data: {
        definition: stackDef.id,
        label: SEED_REVISION_STACK_LABEL,
        status: "draft",
        propContract: stackDefinition.propContract,
        slotContract: stackDefinition.slotContract,
      },
      overrideAccess: true,
    });

    await payload.create({
      collection: "component-revisions",
      data: {
        definition: textDef.id,
        label: SEED_REVISION_TEXT_LABEL,
        status: "published",
        propContract: textDefinition.propContract,
        slotContract: textDefinition.slotContract,
      },
      overrideAccess: true,
    });

    await payload.create({
      collection: "component-revisions",
      data: {
        definition: cardDef.id,
        label: "Local seed · Card (published)",
        status: "published",
        propContract: cardDefinition.propContract,
        slotContract: cardDefinition.slotContract,
        composition: seedCardComposition,
      },
      overrideAccess: true,
    });

    const composition = await payload.create({
      collection: "page-compositions",
      data: {
        title: "Local seed (builder / composer)",
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
        title: "Local seed page",
        slug: SEED_PAGE_SLUG,
        pageComposition: composition.id,
        templateSlotValues: {
          "hero-headline": "Welcome — local seed page (template slot).",
        },
        content: [
          {
            componentDefinition: cardDef.id,
            slotValues: {
              headline:
                "Designer block on the same page as the template (combined).",
            },
          },
        ],
      },
      draft: true,
      overrideAccess: true,
    });

    await payload.update({
      collection: "pages",
      id: page.id,
      data: { _status: "published" },
      overrideAccess: true,
    });

    const designerPage = await payload.create({
      collection: "pages",
      data: {
        title: "Local seed designer block",
        slug: SEED_PAGE_DESIGNER_SLUG,
        content: [
          {
            componentDefinition: cardDef.id,
            slotValues: { headline: "Hello World" },
          },
        ],
      },
      draft: true,
      overrideAccess: true,
    });
    await payload.update({
      collection: "pages",
      id: designerPage.id,
      data: { _status: "published" },
      overrideAccess: true,
    });

    const base = (process.env.SITE_URL ?? "http://localhost:3000").replace(
      /\/$/,
      "",
    );

    const compositionId = String(composition.id);

    console.log("\n[seed] Done.\n");
    console.log(
      `  Page template:      ${SEED_PAGE_COMPOSITION_SLUG} (id: ${compositionId})`,
    );
    console.log(
      `  Page (published): ${SEED_PAGE_SLUG} (template slot hero-headline + seed.card block)`,
    );
    console.log(
      `  Designer page:    ${SEED_PAGE_DESIGNER_SLUG} (blocks only, no template)`,
    );
    console.log(`  Token set:        ${SEED_TOKEN_SCOPE_KEY} (published)`);
    console.log(
      "  Design system:    global defaultTokenSet + activeBrandKey set",
    );
    console.log(
      "  Token overrides:  color.surface.primary, space.scale.2 (on local-seed set)",
    );
    console.log(
      "  Editor block catalog: seed.card only (primitives are builder-only, not in picker)",
    );
    console.log(
      "  Comp revisions:     Stack (draft), Text + Card (published) — workflow only; defs hold published composition",
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
