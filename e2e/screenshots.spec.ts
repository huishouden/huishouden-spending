import { expect, test } from '@playwright/test';
import { captureScreenshot } from '@huishouden/pwa-kit/e2e';

// README images of the signed-out app, which shows built-in sample data (no household data).
// Refreshed by CI after each deploy; committed only when they change. The clock is frozen inside
// the sample data's month so totals and "this month" render the same every run.
const fixedTime = '2026-09-27T10:00:00';

test('dashboard', ({ page }) => captureScreenshot(page, 'dashboard', { fixedTime }));

test('dock mode', ({ page }) =>
  captureScreenshot(page, 'dock-mode', {
    fixedTime,
    prepare: async (p) => {
      await p.getByRole('button', { name: 'Dock Mode' }).click();
      await p.waitForTimeout(500);
    },
  }));

test('phone: dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await captureScreenshot(page, 'phone-dashboard', { fixedTime });
});

// The app bar with an invented signed-in person and the account menu open.
test('account menu', ({ page }) =>
  captureScreenshot(page, 'account-menu', {
    fixedTime,
    prepare: async (p) => {
      await p.locator('hh-app-bar').evaluate((bar: HTMLElementTagNameMap['hh-app-bar']) => {
        bar.user = { name: 'Sam Example', email: 'sam@example.com', photoURL: null };
      });
      await p.getByRole('button', { name: 'Signed in as sam@example.com' }).click();
      await expect(p.getByRole('link', { name: 'All apps' })).toBeVisible();
    },
  }));
