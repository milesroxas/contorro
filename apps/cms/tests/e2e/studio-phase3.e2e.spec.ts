import { type Page, expect, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import { login } from "../helpers/login";
import {
  cleanupBuilderE2e,
  designerUser,
  seedDesignerAndComposition,
} from "../helpers/seedBuilderE2e";

test.describe("Phase 3 — Studio MVP", () => {
  let page: Page;
  let compositionId: string;

  test.beforeAll(async ({ browser }) => {
    const { compositionId: cid } = await seedDesignerAndComposition();
    compositionId = cid;

    const context = await browser.newContext();
    page = await context.newPage();

    await login({
      page,
      user: designerUser,
    });
  });

  test.afterAll(async () => {
    await cleanupBuilderE2e();
    await closeTestPayload();
  });

  test("designer composes, styles, saves, restores", async () => {
    await page.goto(`/admin/studio?composition=${compositionId}`);

    await expect(page.getByTestId("builder-app")).toBeVisible({
      timeout: 30_000,
    });

    const paletteBox = page.getByTestId("palette-box");
    const dropRoot = page.getByTestId("builder-canvas-drop-root");

    await paletteBox.dragTo(dropRoot);

    const boxTarget = page.locator('[data-testid^="drop-target-box-"]').first();
    await expect(boxTarget).toBeVisible({ timeout: 10_000 });

    await page.getByTestId("palette-text").dragTo(boxTarget);

    await page
      .locator('[data-testid^="node-tree-"]')
      .filter({ hasText: /text/i })
      .first()
      .click();

    await page.getByTestId("inspector-text-content").fill("Hello");

    await page
      .locator('[data-testid^="node-tree-"]')
      .filter({ hasText: /box/i })
      .first()
      .click();

    await page
      .getByTestId("inspector-style-token-background")
      .selectOption("color.surface.primary");

    await page.getByTestId("save-draft").click();

    await expect(page.getByText(/^Saved$/)).toBeVisible({ timeout: 15_000 });

    await page.reload();

    await expect(page.getByTestId("builder-app")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("builder-canvas-preview")).toContainText(
      "Hello",
    );
  });
});
