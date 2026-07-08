import { compileTokenSet } from "@repo/config-tailwind";
import type { Payload } from "payload";
import { APIError } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeTestPayload, getTestPayload } from "../helpers/getTestPayload.js";

describe("Phase 1 test gate — token compiler", () => {
  it("emits :root/.dark variable blocks bridged to shadcn theme names", () => {
    const compiled = compileTokenSet({
      tokens: [
        {
          key: "color.surface.primary",
          mode: "light",
          category: "color",
          resolvedValue: "#0f172a",
        },
        {
          key: "color.surface.primary",
          mode: "dark",
          category: "color",
          resolvedValue: "#020617",
        },
        {
          key: "color.primary",
          mode: "light",
          category: "color",
          resolvedValue: "#853c00",
        },
        {
          key: "radius.base",
          mode: "light",
          category: "radius",
          resolvedValue: "0.5rem",
        },
        {
          key: "typography.font.sans",
          mode: "light",
          category: "typography",
          resolvedValue: "Geist, sans-serif",
        },
      ],
    });

    expect(compiled.cssVariables).not.toMatch(/@theme/);
    expect(compiled).not.toHaveProperty("tokenUtilityCss");

    const [rootBlock, darkBlock] = compiled.cssVariables.split("\n\n");
    expect(rootBlock).toMatch(/^:root \{/);
    expect(rootBlock).toContain("--surface-primary: #0f172a;");
    expect(rootBlock).toContain("--primary: #853c00;");
    expect(rootBlock).toContain("--radius: 0.5rem;");
    expect(rootBlock).toContain("--font-sans: Geist, sans-serif;");
    expect(darkBlock).toMatch(/^\.dark \{/);
    expect(darkBlock).toContain("--surface-primary: #020617;");
    expect(darkBlock).not.toContain("--primary:");

    expect(compiled.tokenMetadata).toContainEqual({
      key: "color.surface.primary",
      cssVar: "--surface-primary",
      category: "color",
    });
    expect(compiled.tokenMetadata).toContainEqual({
      key: "color.primary",
      cssVar: "--primary",
      category: "color",
    });
  });

  it("emits a dark-only token's value into :root so light mode is never unset", () => {
    const compiled = compileTokenSet({
      tokens: [
        {
          key: "color.glow",
          mode: "dark",
          category: "color",
          resolvedValue: "#22d3ee",
        },
      ],
    });
    const [rootBlock, darkBlock] = compiled.cssVariables.split("\n\n");
    expect(rootBlock).toContain("--glow: #22d3ee;");
    expect(darkBlock).toContain("--glow: #22d3ee;");
  });

  it("supports scoped selectors for studio canvas injection", () => {
    const compiled = compileTokenSet(
      {
        tokens: [
          {
            key: "color.primary",
            mode: "light",
            category: "color",
            resolvedValue: "#111111",
          },
          {
            key: "color.primary",
            mode: "dark",
            category: "color",
            resolvedValue: "#eeeeee",
          },
        ],
      },
      {
        rootSelector: "[data-studio-canvas-mode]",
        darkSelector: '[data-studio-canvas-mode="dark"]',
      },
    );
    expect(compiled.cssVariables).toContain(
      "[data-studio-canvas-mode] {\n  --primary: #111111;",
    );
    expect(compiled.cssVariables).toContain(
      '[data-studio-canvas-mode="dark"] {\n  --primary: #eeeeee;',
    );
    expect(compiled.cssVariables).not.toContain(":root");
  });
});

describe("Phase 1 test gate — Postgres + Payload", () => {
  let payload: Payload;

  beforeAll(async () => {
    payload = await getTestPayload();
  });

  afterAll(async () => {
    await closeTestPayload();
  });

  async function expectApiError400(run: () => Promise<unknown>): Promise<void> {
    try {
      await run();
      expect.fail("expected APIError");
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).status).toBe(400);
    }
  }

  it("rejects invalid token rows with APIError status 400", async () => {
    await expectApiError400(() =>
      payload.create({
        collection: "design-token-sets",
        data: {
          title: "invalid token row",
          scopeKey: `invalid-token-${Date.now()}`,
          tokens: [
            {
              key: "NOT_A_VALID_KEY",
              mode: "light",
              category: "color",
              resolvedValue: "#ffffff",
            },
          ],
          _status: "draft",
        },
        overrideAccess: true,
      }),
    );
  });

  it("rejects resolvedValue CSS injection payloads with APIError status 400", async () => {
    await expectApiError400(() =>
      payload.create({
        collection: "design-token-sets",
        data: {
          title: "css injection",
          scopeKey: `css-injection-${Date.now()}`,
          tokens: [
            {
              key: "color.primary",
              mode: "light",
              category: "color",
              resolvedValue: "red;} body{display:none}",
            },
          ],
          _status: "draft",
        },
        overrideAccess: true,
      }),
    );
  });

  it("rejects non-color shapes for color tokens with APIError status 400", async () => {
    await expectApiError400(() =>
      payload.create({
        collection: "design-token-sets",
        data: {
          title: "not a color",
          scopeKey: `not-a-color-${Date.now()}`,
          tokens: [
            {
              key: "color.primary",
              mode: "light",
              category: "color",
              resolvedValue: "url(https://evil.example/x)",
            },
          ],
          _status: "draft",
        },
        overrideAccess: true,
      }),
    );
  });

  it("creates a draft token set and publishes it", async () => {
    const scopeKey = `gate-publish-${Date.now()}`;
    let createdId: string | number | undefined;

    try {
      const doc = await payload.create({
        collection: "design-token-sets",
        data: {
          title: "gate publish",
          scopeKey,
          tokens: [
            {
              key: "color.surface.primary",
              mode: "light",
              category: "color",
              resolvedValue: "#111111",
            },
          ],
          _status: "draft",
        },
        overrideAccess: true,
      });
      createdId = doc.id;

      const published = await payload.update({
        collection: "design-token-sets",
        id: doc.id,
        data: {
          _status: "published",
        },
        overrideAccess: true,
      });

      expect(published._status).toBe("published");
      expect(published.hasBeenPublished).toBe(true);
    } finally {
      if (createdId !== undefined) {
        await payload.delete({
          collection: "design-token-sets",
          id: createdId,
          overrideAccess: true,
        });
      }
    }
  });

  it("freezes published keys at publish time only (draft removals + additions allowed)", async () => {
    const scopeKey = `gate-freeze-${Date.now()}`;
    const baseToken = {
      key: "color.surface.primary",
      mode: "light" as const,
      category: "color" as const,
      resolvedValue: "#111111",
    };
    const secondToken = {
      key: "color.primary",
      mode: "light" as const,
      category: "color" as const,
      resolvedValue: "#853c00",
    };
    let createdId: string | number | undefined;

    try {
      const doc = await payload.create({
        collection: "design-token-sets",
        data: {
          title: "gate freeze",
          scopeKey,
          tokens: [baseToken, secondToken],
          _status: "published",
        },
        overrideAccess: true,
      });
      createdId = doc.id;

      // Publishing without a previously published key is rejected with the key listed.
      try {
        await payload.update({
          collection: "design-token-sets",
          id: doc.id,
          data: {
            tokens: [baseToken],
            _status: "published",
          },
          overrideAccess: true,
        });
        expect.fail("expected APIError");
      } catch (e) {
        expect(e).toBeInstanceOf(APIError);
        expect((e as APIError).status).toBe(400);
        expect((e as APIError).message).toContain("color.primary");
      }

      // Draft saves are unrestricted — removing a published key as a draft is allowed.
      const draftRemoval = await payload.update({
        collection: "design-token-sets",
        id: doc.id,
        draft: true,
        data: {
          tokens: [baseToken],
          _status: "draft",
        },
        overrideAccess: true,
      });
      expect(draftRemoval.tokens).toHaveLength(1);

      // Additions after publish are always allowed.
      const withAddition = await payload.update({
        collection: "design-token-sets",
        id: doc.id,
        data: {
          tokens: [
            baseToken,
            secondToken,
            {
              key: "color.accent",
              mode: "light",
              category: "color",
              resolvedValue: "#f0f9ff",
            },
          ],
          _status: "published",
        },
        overrideAccess: true,
      });
      expect(withAddition._status).toBe("published");
      expect(withAddition.tokens).toHaveLength(3);
    } finally {
      if (createdId !== undefined) {
        await payload.delete({
          collection: "design-token-sets",
          id: createdId,
          overrideAccess: true,
        });
      }
    }
  });
});
