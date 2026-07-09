import { expect, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import { login } from "../helpers/login";
import {
  cleanupPagesRegionBlockAdmin,
  E2E_REGION_BLOCK_HEADING,
  seedPagesRegionBlockAdminFixture,
} from "../helpers/seedPagesRegionBlockAdmin";
import { cleanupTestUser, seedTestUser, testUser } from "../helpers/seedUser";

/**
 * Pages → layout region → native block: Payload renders the catalog-generated
 * block fields (e.g. the hero Heading text input) with the stored value —
 * no custom Field components involved.
 */
test.describe("Pages admin — native block fields in regions", () => {
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

  test("edit view shows the hero block Heading field in Region main", async ({
    page,
  }) => {
    await login({ page, user: testUser });

    await page.goto(`/admin/collections/pages/${pageId}`);
    await expect(page).toHaveURL(
      new RegExp(`/admin/collections/pages/${pageId}`),
    );

    // Layout regions live on the Content tab; the edit view opens on Page setup.
    await page.getByRole("button", { name: "Content" }).click();

    await expect(
      page.getByText("Layout regions", { exact: false }).first(),
    ).toBeVisible({ timeout: 30_000 });

    // Native blocks field: the hero block row exposes its typed Heading input.
    const heading = page.getByLabel(/^Heading/i).first();
    await expect(heading).toBeVisible({ timeout: 45_000 });
    await expect(heading).toHaveValue(E2E_REGION_BLOCK_HEADING);

    // The design relationship renders with its published design selected.
    await expect(
      page.getByText("E2E region hero design").first(),
    ).toBeVisible();
  });
});
