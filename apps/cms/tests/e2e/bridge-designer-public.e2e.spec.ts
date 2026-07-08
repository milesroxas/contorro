import { expect, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import {
  BRIDGE_E2E_BLOCK_TEXT,
  BRIDGE_E2E_PAGE_SLUG,
  cleanupBridgeE2e,
  seedBridgePublicPage,
} from "../helpers/seedBridgeE2e";

/**
 * Blocks content model — public route renders a native `content` block by
 * injecting its typed rich-text value into the published block design.
 * Data is created via Payload Local API (same contract as the seed script);
 * the browser assertion covers the Next.js page + renderer path.
 */
test.describe("Blocks — public render of a content block", () => {
  test.beforeAll(async () => {
    await seedBridgePublicPage();
  });

  test.afterAll(async () => {
    await cleanupBridgeE2e();
    await closeTestPayload();
  });

  test("published page shows the block's injected rich-text value", async ({
    page,
  }) => {
    await page.goto(`/${BRIDGE_E2E_PAGE_SLUG}`);

    await expect(page.getByText(BRIDGE_E2E_BLOCK_TEXT)).toBeVisible({
      timeout: 15_000,
    });
  });
});
