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

// The household's cards in Settings (the sample household's invented cards).
test('settings: cards', ({ page }) =>
  captureScreenshot(page, 'settings-cards', {
    fixedTime,
    prepare: async (p) => {
      await p.getByRole('button', { name: 'Configuration and Settings Menu' }).click();
      await p.getByRole('button', { name: /^Settings/ }).click();
      await p.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Cards' }).click();
    },
  }));

// A statement file (invented rows) matched to its card, before anything is added.
test('import a statement', ({ page }) =>
  captureScreenshot(page, 'import-statement', {
    fixedTime,
    prepare: async (p) => {
      await p.getByRole('region', { name: 'Bringing spending in' }).getByRole('button', { name: 'Import a statement' }).click();
      const dialog = p.getByRole('dialog', { name: 'Import a statement' });
      await dialog.getByLabel('Statement files').setInputFiles(new URL('./fixtures/statement_1111.csv', import.meta.url).pathname);
      await expect(dialog.getByRole('button', { name: /^Add \d+ transactions?$/ })).toBeVisible();
    },
  }));
