import { expect, test, type Page } from '@playwright/test';
import { alerts } from './fixtures/gmail';

// The signed-out sample household, on a fixed day in March 2031: its own cards and rules, in memory.
// Gmail has no emulator: a stand-in token (window.__gmailTestToken) makes the app call the real Gmail
// REST paths, and page.route answers them.

const fixedTime = '2031-03-15T10:00:00';
const statement = new URL('./fixtures/statement_1111.csv', import.meta.url).pathname;

async function open(page: Page, gmail = true) {
  const searches: string[] = [];
  if (gmail) {
    await page.route('https://gmail.googleapis.com/gmail/v1/users/me/messages**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname.endsWith('/messages')) {
        searches.push(url.searchParams.get('q') ?? '');
        return route.fulfill({ json: { messages: alerts.map((m) => ({ id: m.id, threadId: m.threadId })) } });
      }
      const m = alerts.find((a) => url.pathname.endsWith(`/${a.id}`));
      return m ? route.fulfill({ json: m }) : route.fulfill({ status: 404, json: { error: { message: 'not found' } } });
    });
    await page.addInitScript(() => {
      window.__gmailTestToken = 'test-token';
    });
  }
  await page.clock.setFixedTime(fixedTime);
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Bringing spending in' })).toBeVisible();
  return searches;
}

const bar = (page: Page) => page.getByRole('region', { name: 'Bringing spending in' });
const row = (page: Page, merchant: string) => page.getByRole('button', { name: new RegExp(`^${merchant}, `) });

test('Check email reads card alerts with the household’s alert words, once', async ({ page }) => {
  const searches = await open(page);
  await bar(page).getByRole('button', { name: 'Check email' }).click();
  await expect(bar(page)).toContainText('Checked email just now; 2 new card charges');
  expect(searches[0]).toBe('newer_than:30d (from:(alerts@bank.example.com) OR from:(notices@card.example.com) OR "rewards card")');
  await expect(row(page, 'EXAMPLE GROCERY')).toContainText('Example Visa');
  await expect(row(page, 'EXAMPLE GROCERY')).toContainText('Groceries');
  await expect(row(page, 'EXAMPLE NOODLE BAR')).toContainText('Example Rewards Card');

  await bar(page).getByRole('button', { name: 'Check email' }).click();
  await expect(bar(page)).toContainText('Checked email just now; nothing new');
  await expect(row(page, 'EXAMPLE GROCERY')).toHaveCount(1);
});

test('an expired Gmail token is reported in words, with a retry', async ({ page }) => {
  await page.route('https://gmail.googleapis.com/**', (route) => route.fulfill({ status: 401, json: { error: { message: 'Invalid Credentials' } } }));
  await page.addInitScript(() => {
    window.__gmailTestToken = 'expired-token';
  });
  await page.clock.setFixedTime(fixedTime);
  await page.goto('/');
  await bar(page).getByRole('button', { name: 'Check email' }).click();
  const alert = bar(page).getByRole('alert');
  await expect(alert).toContainText('Gmail access has ended; check email again to allow it.');
  await expect(alert.getByRole('button', { name: 'Try again' })).toBeVisible();
});

test('a statement file is matched to its card, previewed, and replaces the alert for the same purchase', async ({ page }) => {
  await open(page);
  await bar(page).getByRole('button', { name: 'Check email' }).click();
  await expect(bar(page)).toContainText('2 new card charges');

  await bar(page).getByRole('button', { name: 'Import a statement' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import a statement' });
  await dialog.getByLabel('Statement files').setInputFiles(statement);
  const file = dialog.getByRole('region', { name: 'statement_1111.csv' });
  await expect(file.getByLabel('Card')).toHaveValue('c-sample-1');
  await expect(file).toContainText('Columns: Transaction Date, Description, Amount; purchases are negative');
  await expect(file).toContainText('2 new, 1 replacing email alerts, 0 already here; 1 skipped (card payments and never-counted words)');
  await dialog.getByRole('button', { name: 'Add 3 transactions' }).click();
  await expect(page.getByText('Added 2 transactions; 1 email alert replaced by the statement')).toBeVisible();

  // The statement's name and date replace the alert's; one grocery purchase, not two.
  await expect(row(page, 'EXAMPLE GROCERY #42')).toHaveCount(1);
  await expect(row(page, 'EXAMPLE GROCERY')).toHaveCount(0);
  await expect(row(page, 'EXAMPLE BOOKSHOP')).toContainText('Shopping & Retail');

  // The same file again adds nothing.
  await bar(page).getByRole('button', { name: 'Import a statement' }).click();
  await dialog.getByLabel('Statement files').setInputFiles(statement);
  await expect(dialog.getByRole('button', { name: 'Nothing new to add' })).toBeDisabled();
});

test('cards and category rules are the household’s data', async ({ page }) => {
  await open(page, false);
  await page.getByRole('button', { name: 'Configuration and Settings Menu' }).click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });

  await settings.getByRole('button', { name: 'Cards' }).click();
  await settings.getByRole('button', { name: 'Add a card' }).click();
  await settings.getByLabel('Name').fill('Card Four');
  await settings.getByLabel('Last 4 digits').fill('4444');
  await settings.getByLabel('Alert words').fill('alerts@four.example.com');
  await settings.getByRole('button', { name: 'Save card' }).click();
  await expect(settings.getByRole('listitem', { name: 'Card Four' })).toContainText('•••• 4444');

  await settings.getByRole('button', { name: 'Categories' }).click();
  await settings.getByLabel("When the shop's name contains").fill('example bookshop');
  await settings.getByLabel('Category', { exact: true }).fill('Entertainment');
  await settings.getByRole('button', { name: 'Add rule' }).click();
  await settings.getByLabel('Find a rule').fill('bookshop');
  await expect(settings.getByRole('listitem', { name: 'example bookshop' })).toContainText('Entertainment');
  await settings.getByRole('button', { name: 'Close' }).click();

  await bar(page).getByRole('button', { name: 'Import a statement' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import a statement' });
  await dialog.getByLabel('Statement files').setInputFiles(statement);
  await dialog.getByRole('button', { name: 'Add 3 transactions' }).click();
  await expect(row(page, 'EXAMPLE BOOKSHOP')).toContainText('Entertainment');
});

test('a transaction gets a new category, and a rule for the ones after it', async ({ page }) => {
  await open(page);
  await bar(page).getByRole('button', { name: 'Check email' }).click();
  await row(page, 'EXAMPLE NOODLE BAR').click();
  const dialog = page.getByRole('dialog', { name: 'EXAMPLE NOODLE BAR' });
  await dialog.getByLabel('Category', { exact: true }).fill('Dining & Food');
  await dialog.getByLabel('Use this category for every charge whose name contains').check();
  await expect(dialog.getByRole('textbox', { name: 'Name contains' })).toHaveValue('example noodle bar');
  await dialog.getByRole('button', { name: 'Save' }).click();
  await expect(row(page, 'EXAMPLE NOODLE BAR')).toContainText('Dining & Food');
  await page.getByRole('button', { name: 'Configuration and Settings Menu' }).click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Categories' }).click();
  await settings.getByLabel('Find a rule').fill('noodle');
  await expect(settings.getByRole('listitem', { name: 'example noodle bar' })).toContainText('Dining & Food');
});

test("a Sheet's tabs, pasted, become cards and rules", async ({ page }) => {
  await open(page, false);
  await page.getByRole('button', { name: 'Configuration and Settings Menu' }).click();
  await page.getByRole('button', { name: /^Settings/ }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await settings.getByRole('button', { name: 'Email and Sheet' }).click();
  await settings.getByText("Or paste the tabs' rows").click();
  await settings.getByLabel('Cards tab (Last4, Card, Alert source, Alert keywords)').fill('Last4\tCard\tAlert source\tAlert keywords\n4444\tCard Four\tExample Bank\tfour rewards');
  await settings.getByLabel('Categories tab (Merchant contains, Category)').fill('example kiosk\tFood & Drink');
  await settings.getByRole('button', { name: 'Read the rows' }).click();
  await expect(settings.getByRole('region', { name: 'Found in the Sheet' })).toContainText('Found 1 card (Card Four), 1 category rule and 0 labels.');
  await settings.getByRole('button', { name: 'Bring them in' }).click();
  await expect(settings).toContainText('Added 1 card, 1 category rule and 0 labels.');
  await settings.getByRole('button', { name: 'Cards' }).click();
  await expect(settings.getByRole('listitem', { name: 'Card Four' })).toContainText('Alerts: four rewards');
});
