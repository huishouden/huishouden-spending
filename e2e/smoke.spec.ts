import { expect, test } from '@playwright/test';
import { expectCleanLoad, expectGoogleSignInPopup, expectInstallable } from '@piekstra/huishouden-pwa-kit/e2e';

// Each check here caught, or would have caught, a bug a person found by hand first.

test('loads without runtime errors', async ({ page }) => {
  await expectCleanLoad(page);
  await expect(page.getByRole('button', { name: 'Connect My Google Sheet' })).toBeVisible();
});

test('is installable', ({ page, request }) => expectInstallable(page, request));

test('Google sign-in popup reaches Google with an allowed redirect URI', ({ page, context }) =>
  expectGoogleSignInPopup(page, context, async (p) => {
    await p.getByRole('button', { name: 'Connect My Google Sheet' }).click();
    await p.getByRole('button', { name: 'Sign in with Google' }).click();
  }));
