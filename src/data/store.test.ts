import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { detectMapping, parseStatement, readCsv } from '../lib/csvImport';
import { applyWrites, DEFAULT_RULE_DOCS, derive, emptyDocs, makeActions, type Docs, type Write } from './store';
import { DEFAULT_SPEND_SETTINGS } from './model';

/** The actions over in-memory documents, recording every commit. */
function harness(start: Docs = emptyDocs()) {
  let docs = start;
  const commits: Write[][] = [];
  let t = Date.UTC(2031, 2, 20);
  const actions = makeActions(
    () => derive(docs, DEFAULT_SPEND_SETTINGS),
    'sam@example.com',
    async (w) => {
      commits.push(w);
      docs = applyWrites(docs, w);
    },
    () => ++t,
  );
  return { actions, commits, get: () => derive(docs, DEFAULT_SPEND_SETTINGS), docs: () => docs };
}

const file = readCsv(readFileSync(new URL('../lib/__fixtures__/csv/purchases-positive_1111.csv', import.meta.url), 'utf8'));
const rows = (rules = DEFAULT_RULE_DOCS) =>
  parseStatement(file, detectMapping(file).mapping!, { card: 'Card One', cards: [], rules, ignoredKeywords: [] }).rows;

describe('first change makes the defaults the household’s own', () => {
  test('until then defaults apply and nothing is stored', () => {
    const h = harness();
    expect(h.get().settingsSaved).toBe(false);
    expect(h.get().rules).toEqual(DEFAULT_RULE_DOCS);
  });

  test('a budget change writes the settings and every default rule once', async () => {
    const h = harness();
    await h.actions.saveSettings({ monthlyBudget: 1500 });
    expect(h.get().settings.monthlyBudget).toBe(1500);
    expect(h.get().rules.length).toBe(DEFAULT_RULE_DOCS.length);
    await h.actions.saveSettings({ monthlyBudget: 1600 });
    expect(h.commits[1].filter((w) => w.collection === 'spendingRules')).toHaveLength(0);
  });

  test('deleting a default rule before anything is saved keeps it deleted', async () => {
    const h = harness();
    await h.actions.deleteRule(DEFAULT_RULE_DOCS[0].id);
    expect(h.get().rules.find((r) => r.id === DEFAULT_RULE_DOCS[0].id)).toBeUndefined();
    expect(h.get().rules.length).toBe(DEFAULT_RULE_DOCS.length - 1);
  });
});

describe('statement import', () => {
  test('a file imported twice adds its rows once', async () => {
    const h = harness();
    expect(await h.actions.importStatements([{ rows: rows() }])).toEqual({ added: 4, replaced: 0, duplicates: 0 });
    expect(await h.actions.importStatements([{ rows: rows() }])).toEqual({ added: 0, replaced: 0, duplicates: 4 });
    const records = h.get().records;
    expect(records).toHaveLength(4);
    expect(records.every((r) => r.id.startsWith('st-') && r.source === 'statement' && r.by === 'sam@example.com')).toBe(true);
  });

  test('a statement row replaces the alert for the same purchase', async () => {
    const h = harness();
    await h.actions.addAlerts([{ id: 'al-m1', emailId: 'm1', date: '2031-03-15', description: 'COFFEE ROASTERS', amount: 4.75, category: 'Dining & Food', card: 'Card One', type: 'Sale' }]);
    expect(await h.actions.importStatements([{ rows: rows() }])).toEqual({ added: 3, replaced: 1, duplicates: 0 });
    const replaced = h.get().records.find((r) => r.id === 'al-m1')!;
    expect(replaced).toMatchObject({ source: 'statement', date: '2031-03-14', description: 'EXAMPLE COFFEE ROASTERS' });
    expect(h.get().records).toHaveLength(4);
  });

  test('overlapping files imported together add each purchase once', async () => {
    const h = harness();
    expect(await h.actions.importStatements([{ rows: rows() }, { rows: rows() }])).toEqual({ added: 4, replaced: 0, duplicates: 4 });
  });

  test("the file's columns are remembered on its card", async () => {
    const h = harness();
    await h.actions.saveCard(null, { name: 'Card One', last4: '1111', alertWords: [] });
    const card = h.get().cards[0];
    const mapping = detectMapping(file).mapping!;
    await h.actions.importStatements([{ rows: rows(), remember: { cardId: card.id, mapping } }]);
    expect(h.get().cards[0].csv).toEqual(mapping);
  });
});

test('changing a category keeps the rest of the transaction', async () => {
  const h = harness();
  await h.actions.importStatements([{ rows: rows() }]);
  const r = h.get().records.find((x) => x.description === 'EXAMPLE STREAMING')!;
  await h.actions.recategorise(r, 'Subscriptions & Tech');
  expect(h.get().records.find((x) => x.id === r.id)).toEqual({ ...r, category: 'Subscriptions & Tech' });
});

test("the Sheet's tabs move in once: cards merge by name and digits, labels are not repeated", async () => {
  const h = harness();
  const s = { cards: [{ name: 'Card One', last4: '1111', issuer: 'Example Bank', alertWords: ['blue'] }], rules: [{ contains: 'example cafe', category: 'Groceries' }], labels: ['Bank/Alerts'] };
  expect(await h.actions.importSheetSettings(s)).toEqual({ cards: 1, rules: 1, labels: 1 });
  expect(await h.actions.importSheetSettings(s)).toEqual({ cards: 0, rules: 1, labels: 0 });
  expect(h.get().cards).toEqual([expect.objectContaining({ name: 'Card One', last4: '1111', issuer: 'Example Bank', alertWords: ['blue'] })]);
  expect(h.get().settings.alertLabels).toEqual(['Bank/Alerts']);
  expect(h.get().rules.find((r) => r.contains === 'example cafe')?.category).toBe('Groceries');
});
