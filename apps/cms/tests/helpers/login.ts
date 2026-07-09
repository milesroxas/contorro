import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export interface LoginOptions {
  page: Page;
  user: {
    email: string;
    password: string;
  };
  /**
   * URL (path) the app settles on after login. Admins/editors stay on
   * `/admin`; designers are client-redirected to `/studio` by
   * DesignerDashboardRedirect — pass `/studio` for designer users so the
   * redirect finishes before the test navigates (avoids net::ERR_ABORTED
   * from colliding navigations).
   */
  settledUrl?: string;
}

/**
 * Logs the user into the admin panel via the login page and waits for the
 * post-login navigation to settle.
 */
export async function login({
  page,
  user,
  settledUrl = "/admin",
}: LoginOptions): Promise<void> {
  await page.goto("/admin/login");

  await page.fill("#field-email", user.email);
  await page.fill("#field-password", user.password);
  await page.click('button[type="submit"]');

  await page.waitForURL(`${settledUrl}**`);

  if (settledUrl === "/admin") {
    const dashboardArtifact = page.locator('span[title="Dashboard"]');
    await expect(dashboardArtifact).toBeVisible();
  }
}
