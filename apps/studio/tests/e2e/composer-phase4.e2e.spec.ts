import { type Page, expect, test } from "@playwright/test";
import { closeTestPayload } from "../helpers/getTestPayload";
import { login } from "../helpers/login";
import {
  cleanupComposerPhase4,
  designerUser,
  editorUser,
  seedComposerPhase4,
} from "../helpers/seedComposerPhase4";

test.describe.configure({ mode: "serial" });

test.describe("Phase 4 — Editor Composer", () => {
  let page: Page;
  let pageId: string;
  let compositionId: string;
  let visibleDefName: string;
  let hiddenDefName: string;

  test.beforeAll(async ({ browser }) => {
    const seeded = await seedComposerPhase4();
    pageId = seeded.pageId;
    compositionId = seeded.compositionId;
    visibleDefName = seeded.visibleDefName;
    hiddenDefName = seeded.hiddenDefName;

    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await cleanupComposerPhase4();
    await closeTestPayload();
  });

  test("content editor cannot open builder; edits composer and catalog", async () => {
    await login({ page, user: editorUser });

    await page.goto(`/admin/builder?composition=${compositionId}`);
    await expect(
      page.getByText(/visual builder is limited to admin and designer/i),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(`/admin/composer?page=${pageId}`);
    await expect(page.getByTestId("composer-app")).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId("composer-text-content").fill("ComposerHello");

    await page.getByTestId("composer-save-draft").click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15_000 });

    const catalog = page.getByTestId("composer-catalog-list");
    await expect(catalog.getByText(visibleDefName)).toBeVisible();
    await expect(catalog.getByText(hiddenDefName)).not.toBeVisible();

    await expect(page.getByTestId("composer-publish")).toHaveCount(0);
  });

  test("designer publishes page; public route shows content", async () => {
    const context = await page.context().browser()?.newContext();
    if (!context) {
      throw new Error("browser context");
    }
    const p = await context.newPage();
    await login({ page: p, user: designerUser });

    await p.goto(`/admin/composer?page=${pageId}`);
    await expect(p.getByTestId("composer-app")).toBeVisible({
      timeout: 30_000,
    });

    await Promise.all([
      p.waitForResponse(
        (response) =>
          response.url().includes("/api/gateway/composer/pages/") &&
          response.url().includes("/publish") &&
          response.request().method() === "POST",
      ),
      p.getByTestId("composer-publish").click(),
    ]);

    await p.goto("/composer-e2e-page");
    await expect(p.getByText("ComposerHello")).toBeVisible({
      timeout: 15_000,
    });

    await context.close();
  });
});
