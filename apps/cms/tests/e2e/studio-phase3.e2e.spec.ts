import { expect, type Page, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import { login } from "../helpers/login";
import {
  cleanupBuilderE2e,
  designerUser,
  seedDesignerAndComposition,
} from "../helpers/seedStudioE2e";

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
      settledUrl: "/studio",
    });
  });

  test.afterAll(async () => {
    await cleanupBuilderE2e();
    await closeTestPayload();
  });

  test("designer composes, styles, saves, restores", async () => {
    await page.goto(`/studio?composition=${compositionId}`);

    await expect(page.getByTestId("studio-app")).toBeVisible({
      timeout: 30_000,
    });

    const paletteBox = page.getByTestId("palette-box");
    const dropRoot = page.getByTestId("studio-canvas-drop-root");

    await paletteBox.dragTo(dropRoot);

    // The box lands in the layers tree; canvas insertion zones only mount
    // while a drag is active, so drive the second drop manually: start the
    // drag, then target the empty box's zone once it exists.
    await expect(page.locator('[data-testid^="node-tree-"]')).toHaveCount(2, {
      timeout: 10_000,
    });

    // Dropping switches the sidebar to Layers; return to the palette tab
    // via its keyboard shortcut (global handler, digit 3 = Primitives).
    await page.getByTestId("studio-app").click({ position: { x: 4, y: 4 } });
    await page.keyboard.press("3");
    await expect(page.getByTestId("palette-text")).toBeVisible({
      timeout: 10_000,
    });
    await page.getByTestId("palette-text").hover();
    await page.mouse.down();
    // Raw coordinate moves: the drag overlay intercepts pointer events, so
    // locator.hover() would wait forever on actionability checks.
    const rootRect = await dropRoot.boundingBox();
    if (!rootRect) {
      throw new Error("canvas drop root has no bounding box");
    }
    await page.mouse.move(
      rootRect.x + rootRect.width / 2,
      rootRect.y + rootRect.height / 2,
      { steps: 10 },
    );
    const boxTarget = page.locator('[data-testid^="drop-target-box-"]').first();
    await expect(boxTarget).toBeVisible({ timeout: 10_000 });
    const targetRect = await boxTarget.boundingBox();
    if (!targetRect) {
      throw new Error("box drop target has no bounding box");
    }
    await page.mouse.move(
      targetRect.x + targetRect.width / 2,
      targetRect.y + targetRect.height / 2,
      { steps: 10 },
    );
    await page.mouse.up();

    await page
      .locator('[data-testid^="node-tree-"]')
      .filter({ hasText: /text/i })
      .first()
      .click();

    // Text content lives in the inspector's Settings tab.
    await page.getByRole("tab", { name: "Settings" }).click();
    await page.getByTestId("inspector-text-content").fill("Hello");

    await page
      .locator('[data-testid^="node-tree-"]')
      .filter({ hasText: /box/i })
      .first()
      .click();

    await page.getByRole("tab", { name: "Styles" }).click();
    // Style sections are collapsed; background is under "Color". Radix
    // select: open the picker, choose the seeded `color.primary` token.
    await page.getByRole("button", { name: "Color", exact: true }).click();
    await page.locator("#style-background").click();
    await page.getByRole("option", { name: /^Primary$/ }).click();

    await page.getByTestId("studio-save-menu-trigger").click();
    await page.getByTestId("save-draft").click();

    await expect(page.getByText(/^Draft$/)).toBeVisible({ timeout: 15_000 });

    await page.reload();

    await expect(page.getByTestId("studio-app")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId("studio-canvas-preview")).toContainText(
      "Hello",
    );
  });
});
