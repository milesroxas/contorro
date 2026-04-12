import { expect, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import {
  BRIDGE_E2E_PAGE_SLUG,
  cleanupBridgeE2e,
  seedBridgePublicPage,
} from "../helpers/seedBridgeE2e";

/**
 * Restructure §D.5 — public route renders designer blocks with slot substitution.
 * Data is created via Payload Local API (same contract as the seed script); the
 * browser assertion covers the Next.js page + renderer path.
 */
test.describe("v0.4 — Designer bridge (public render)", () => {
  test.beforeAll(async () => {
    await seedBridgePublicPage();
  });

  test.afterAll(async () => {
    await cleanupBridgeE2e();
    await closeTestPayload();
  });

  test("published page shows substituted slot text from designer block", async ({
    page,
  }) => {
    await page.goto(`/${BRIDGE_E2E_PAGE_SLUG}`);

    await expect(page.locator("article")).toContainText("Hello World", {
      timeout: 15_000,
    });
  });
});
