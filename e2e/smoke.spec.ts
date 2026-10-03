import { expect, test } from '@playwright/test';
import { expectCleanLoad, expectCompactSampleBanner, expectGoogleSignInPopup, expectHuishoudenFrame, expectInstallable, expectSecurityHeaders } from '@huishouden/pwa-kit/e2e';

// Each check here caught, or would have caught, a bug a person found by hand first.

test('loads without runtime errors', async ({ page }) => {
  await expectCleanLoad(page);
  await expectHuishoudenFrame(page, { app: 'Spending', portalUrl: 'https://huishouden-piekstra.web.app' });
  await expect(page.locator('hh-app-bar').getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
});

test('is installable', ({ page, request }) => expectInstallable(page, request));

test('Google sign-in popup reaches Google with an allowed redirect URI', ({ page, context }) =>
  expectGoogleSignInPopup(page, context, async (p) => {
    await p.getByRole('button', { name: 'Sign in with Google' }).first().click();
  }));

test('sends the security headers and leaves sign-in un-framed', ({ request }) => expectSecurityHeaders(request, '/', {}));

test('Sample data banner is one line on a phone', ({ page }) => expectCompactSampleBanner(page, '/'));
