import {
  TOKEN_PUBLISHED,
  type TokenPublishedPayload,
} from "@repo/application-design-system";
import { compileTokenSet } from "@repo/config-tailwind";
import { defaultInProcessEventBus } from "@repo/infrastructure-event-bus";
import type { Payload } from "payload";
import { APIError } from "payload";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeTestPayload, getTestPayload } from "../helpers/getTestPayload.js";

describe("Phase 1 test gate — token compiler", () => {
  it("emits an @theme CSS block and token metadata for the resolver", () => {
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
      ],
    });
    expect(compiled.cssVariables).toMatch(/@theme/);
    expect(compiled.cssVariables).toContain("--color-surface-primary--light");
    expect(compiled.cssVariables).toContain("--color-surface-primary--dark");
    expect(compiled.cssVariables).toContain(".dark");
    expect(compiled.tokenUtilityCss).toContain(
      ".bg-color-surface-primary { background-color: var(--color-surface-primary); }",
    );
    expect(compiled.tokenMetadata[0]?.key).toBe("color.surface.primary");
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

  it("rejects invalid token rows with APIError status 400", async () => {
    try {
      await payload.create({
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
      });
      expect.fail("expected APIError");
    } catch (e) {
      expect(e).toBeInstanceOf(APIError);
      expect((e as APIError).status).toBe(400);
    }
  });

  it("creates a draft token set, publishes it, and emits TokenPublished once", async () => {
    const received: TokenPublishedPayload[] = [];
    const unsubscribe = defaultInProcessEventBus.subscribe(
      TOKEN_PUBLISHED,
      async (event) => {
        received.push(event.payload as TokenPublishedPayload);
      },
    );

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

      await payload.update({
        collection: "design-token-sets",
        id: doc.id,
        data: {
          _status: "published",
        },
        overrideAccess: true,
      });

      expect(received).toHaveLength(1);
      expect(received[0]?.scopeKey).toBe(scopeKey);
      expect(received[0]?.tokenSetId).toBe(String(doc.id));
    } finally {
      unsubscribe();
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
