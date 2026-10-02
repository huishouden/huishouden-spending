import { expect, test, type Page } from '@playwright/test';
import { signInTestUser } from '@huishouden/pwa-kit/e2e';

// Signed in as an invented test user on the staging site (pwa-kit STANDARD.md "Staging"): the real
// staging Firestore and rules, the seeded test household. Each run saves a value unique to it and
// looks for exactly that.
test.skip(!process.env.HH_STAGING_SA, 'signed-in tests run against staging, in CI');

async function budgetSettings(page: Page) {
  await page.locator('hh-app-bar').getByRole('button', { name: 'Settings' }).click({ timeout: 20_000 });
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Budget', exact: true }).click();
  return settings;
}

test('a budget one member saves is the household budget for the other', async ({ page, browser }) => {
  await signInTestUser(page, { email: 'test-a@example.com' });
  await expect(page.getByText('Sample data')).toHaveCount(0);
  // A round number unique to this run: $1,010 to $9,990.
  const budget = String((101 + (Date.now() % 899)) * 10);
  const settings = await budgetSettings(page);
  await settings.getByLabel('Monthly budget').fill(budget);
  await settings.getByRole('button', { name: 'Save budget' }).click();
  await expect(settings.getByRole('status')).toHaveText('Saved');

  // Saved in the household, not just on this screen: the other member's own browser reads it.
  const other = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const theirs = await other.newPage();
    await signInTestUser(theirs, { email: 'test-b@example.com' });
    await expect((await budgetSettings(theirs)).getByLabel('Monthly budget')).toHaveValue(budget, { timeout: 20_000 });
  } finally {
    await other.close();
  }
});

// Staging path check (test PR, closed unmerged).
