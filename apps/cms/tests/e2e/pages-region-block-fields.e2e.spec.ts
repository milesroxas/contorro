import { expect, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import { login } from "../helpers/login";
import {
  cleanupPagesRegionBlockAdmin,
  seedPagesRegionBlockAdminFixture,
} from "../helpers/seedPagesRegionBlockAdmin";
import { cleanupTestUser, seedTestUser, testUser } from "../helpers/seedUser";

/**
 * Regression: Pages → layout region → block must show CMS fields (e.g. Headline) for the selected
 * component, same contract as template CMS fields.
 */
test.describe("Pages admin — block CMS fields in regions", () => {
  test.describe.configure({ mode: "serial" });

  let pageId: number;

  test.beforeAll(async () => {
    await seedTestUser();
    const out = await seedPagesRegionBlockAdminFixture();
    pageId = out.pageId;
  });

  test.afterAll(async () => {
    await cleanupPagesRegionBlockAdmin();
    await cleanupTestUser();
    await closeTestPayload();
  });

  test("edit view shows Headline field for block in Region main", async ({
    page,
  }) => {
    await login({ page, user: testUser });

    await page.goto(`/admin/collections/pages/${pageId}`);
    await expect(page).toHaveURL(
      new RegExp(`/admin/collections/pages/${pageId}`),
    );

    await expect(
      page.getByRole("heading", { name: /layout regions/i }),
    ).toBeVisible({ timeout: 30_000 });

    const headline = page.getByLabel(/^Headline/i).first();
    await expect(headline).toBeVisible({ timeout: 45_000 });
    await expect(headline).toHaveValue("E2E block headline seed");
  });
});
