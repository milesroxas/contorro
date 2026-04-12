import { getTestPayload } from "./getTestPayload.js";

/** Stable slugs / keys for `bridge-designer-public.e2e.spec.ts`. */
export const BRIDGE_E2E_PAGE_SLUG = "e2e-bridge-public";
export const BRIDGE_E2E_COMPONENT_KEY = "e2e-bridge-card";

const cardEditorFieldsManifest = {
  editorFields: [
    {
      name: "headline",
      type: "text" as const,
      required: true,
      label: "Headline",
    },
  ],
};

const cardComposition = {
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
      editorFields: cardEditorFieldsManifest,
      composition: cardComposition,
    },
    overrideAccess: true,
  });

  await payload.update({
    collection: "components",
    id: def.id,
    data: {},
    draft: false,
    overrideAccess: true,
  });

  const draftPage = await payload.create({
    collection: "pages",
    data: {
      title: "E2E bridge public",
      slug: BRIDGE_E2E_PAGE_SLUG,
      content: [
        {
          componentDefinition: def.id,
          editorFieldValues: { headline: "Hello World" },
        },
      ],
    },
    draft: true,
    overrideAccess: true,
  });

  await payload.update({
    collection: "pages",
    id: draftPage.id,
    data: { _status: "published" },
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
