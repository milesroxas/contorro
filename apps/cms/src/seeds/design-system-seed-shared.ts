import type { Payload } from "payload";

/** Stable scope key — upsert targets this document (may gain a `-v{timestamp}` suffix if keys drift after publish). */
export const SEED_TOKEN_SCOPE_KEY = "seed-tokens";

export type SeedDesignSystemTokensResult = {
  seededScopeKey: string;
  tokenSetId: string | number;
};

function buildSeedTokenRows() {
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

  return [...seedTokens];
}

/**
 * Upserts the canonical seed design token set and wires `design-system-settings` (default set + active brand key).
 * Safe for production: does not delete users, pages, or compositions.
 */
export async function seedDesignSystemTokens(
  payload: Payload,
): Promise<SeedDesignSystemTokensResult> {
  const seedTokens = buildSeedTokenRows();

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
    await payload.update({
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
    tokenSet = { id: existingTokenSet.id };
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

  return { seededScopeKey, tokenSetId: tokenSet.id };
}
