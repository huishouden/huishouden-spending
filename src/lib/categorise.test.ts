import { describe, expect, test } from 'bun:test';
import { categorise, DEFAULT_RULES, matchesRule, ruleCategory } from './categorise';

describe('categorise', () => {
  test('default rules cover the usual kinds of shop', () => {
    expect(categorise('EXAMPLE COFFEE CO', DEFAULT_RULES)).toBe('Dining & Food');
    expect(categorise('SUPERMARKET 0042', DEFAULT_RULES)).toBe('Groceries');
    expect(categorise('EXAMPLE PHARMACY #12', DEFAULT_RULES)).toBe('Health & Personal Care');
  });

  test('the longest matching phrase wins', () => {
    expect(categorise('AMAZON WEB SERVICES', DEFAULT_RULES)).toBe('Subscriptions & Tech');
    expect(categorise('AMAZON.COM*EXAMPLE', DEFAULT_RULES)).toBe('Shopping & Retail');
  });

  test("the household's own rule beats a shorter default", () => {
    const rules = [...DEFAULT_RULES, { contains: 'example cafe', category: 'Groceries' }];
    expect(categorise('EXAMPLE CAFE #3', rules)).toBe('Groceries');
    expect(categorise('OTHER CAFE', rules)).toBe('Dining & Food');
  });

  test('on a tie the later rule wins', () => {
    expect(ruleCategory('EXAMPLE THING', [{ contains: 'thing', category: 'A' }, { contains: 'thing', category: 'B' }])).toBe('B');
  });

  test("no rule: the bank's category in the dashboard's words, else Miscellaneous", () => {
    expect(categorise('EXAMPLE 123', [], 'Food & Drink')).toBe('Dining & Food');
    expect(categorise('EXAMPLE 123', [])).toBe('Miscellaneous');
  });

  test('phrases match from the start of a word, any case', () => {
    expect(matchesRule('LAS VEGAS SOUVENIRS', 'gas')).toBe(false);
    expect(matchesRule('EXAMPLE GAS STATION', 'GAS')).toBe(true);
    expect(matchesRule('EXAMPLE VETERINARY', 'veterinar')).toBe(true);
  });
});
