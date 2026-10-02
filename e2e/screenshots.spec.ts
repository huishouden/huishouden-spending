import { test } from '@playwright/test';
import { captureScreenshot } from '@piekstra/huishouden-pwa-kit/e2e';

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
