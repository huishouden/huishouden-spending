/**
 * HOUSEHOLD CARD SPEND: Gmail card alerts -> Google Sheet (v4)
 *
 * Scans Gmail for Chase, Visa and Robinhood purchase alerts and inserts them at the top of the
 * sheet, newest first. Rows from bank statement imports (Source column blank or "statement") are
 * the source of truth; an alert that matches one is skipped instead of duplicated.
 *
 * Setup: open the Sheet as the Google account that receives the card alerts, then
 * Extensions > Apps Script, paste this file, Save, and run setupAutoSyncTrigger once.
 * Upgrading from an older version needs nothing extra: the first run rescans the last 30 days.
 * This file is generated from apps-script/Code.gs in the household-spending repo; edit it there.
 */

const SYNC_CONFIG = {
  SHEET_NAME: 'Sheet1',
  CARDS_SHEET_NAME: 'Cards',
  CATEGORIES_SHEET_NAME: 'Categories',
  // Leave '' when the script is bound to the spreadsheet.
  SPREADSHEET_ID: '',
  PROCESSED_LABEL: 'Household-Spend-Synced',
  SEARCH_WINDOW: 'newer_than:30d',
  // An alert is the same transaction as an existing row when amount and card match and the dates
  // are this close. Alerts carry the email date; statements carry the transaction date.
  MATCH_WINDOW_DAYS: 3,
  // Gmail labels your filters put card alerts under, one per row in column A of this tab (as Gmail
  // shows them, e.g. "Bank/Transactions"). Optional: senders and subjects are searched anyway.
  ALERT_LABELS_SHEET_NAME: 'Alert labels',
};

// Card display names, keyed by the last four digits alerts quote, come from the Sheet's "Cards" tab
// (Last4 | Card | Alert source) so no card details live in this code. Names must match the ones
// statement imports use, or the dashboard splits a card in two. Loaded at the start of each run.
let CARDS_BY_LAST4 = {};

function loadCards(ss) {
  const tab = ss.getSheetByName(SYNC_CONFIG.CARDS_SHEET_NAME);
  CARD_KEYWORDS = [];
  if (!tab || tab.getLastRow() < 2) return {};
  const cards = {};
  const width = Math.min(4, tab.getLastColumn());
  for (const [last4, name, , keywords] of tab.getRange(2, 1, tab.getLastRow() - 1, width).getValues()) {
    const digits = String(last4).trim().padStart(4, '0');
    const card = String(name || '').trim();
    if (!card) continue;
    if (/^\d{4}$/.test(digits)) cards[digits] = card;
    const words = String(keywords || '').split('|').map((w) => w.trim()).filter(Boolean);
    if (words.length) CARD_KEYWORDS.push([keywordPattern(words), card]);
  }
  return cards;
}

function keywordPattern(words) {
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  return new RegExp('\\b(?:' + escaped.join('|') + ')\\b', 'i');
}

// Fallback when an alert names the card product but not its digits: the Cards tab's optional
// "Alert keywords" column (D), e.g. "travel rewards", checked top to bottom, so list specific
// keywords ("travel rewards") above general ones ("travel").
let CARD_KEYWORDS = [];

const HEADERS = ['Date', 'Description', 'Amount', 'Category', 'Card', 'Type', 'Source'];

/** Gmail search for card alerts: known senders and subjects, plus any labels from the sheet. */
function buildSearchQuery(labels) {
  const labelTerms = labels.map((l) => 'label:' + l.toLowerCase().replace(/[\/\s]+/g, '-'));
  return SYNC_CONFIG.SEARCH_WINDOW + ' -label:' + SYNC_CONFIG.PROCESSED_LABEL + ' (' +
  'from:(cardalerts.visa.com OR alerts@cardalerts.visa.com OR purchasealerts@visa.com) OR ' +
  'from:(no.reply.alerts@chase.com OR alerts@chase.com) OR ' +
  'from:(notifications@robinhood.com) OR ' +
  labelTerms.map((t) => t + ' OR ').join('') +
  'subject:("Visa Purchase Alert" OR "Transaction Alert" OR "Card Alert")' +
  ')';
}

function loadAlertLabels(ss) {
  const tab = ss.getSheetByName(SYNC_CONFIG.ALERT_LABELS_SHEET_NAME);
  if (!tab || tab.getLastRow() < 2) return [];
  return tab.getRange(2, 1, tab.getLastRow() - 1, 1).getValues().map(([l]) => String(l).trim()).filter(Boolean);
}

function syncCardTransactionsFromGmail() {
  // First run after upgrading: older versions labelled threads they mis-parsed, so rescan once
  // without the label filter. Matching against existing rows keeps the rescan from duplicating.
  const props = PropertiesService.getScriptProperties();
  // Bump the key when a parser change should re-read the last 30 days once.
  const resyncKey = 'RESYNCED_V4_2';
  if (!props.getProperty(resyncKey)) {
    const result = resyncLast30Days();
    props.setProperty(resyncKey, new Date().toISOString());
    return result;
  }
  return syncFromQuery(buildSearchQuery(loadAlertLabels(getTargetSheet().getParent())));
}

/**
 * Run once from the editor after upgrading from an older version: rescans the last 30 days
 * including threads an older version already labelled (and may have mis-parsed or skipped).
 * Safe to repeat: alerts matching existing rows are skipped.
 */
function resyncLast30Days() {
  const query = buildSearchQuery(loadAlertLabels(getTargetSheet().getParent()));
  return syncFromQuery(query.replace(' -label:' + SYNC_CONFIG.PROCESSED_LABEL, ''));
}

function syncFromQuery(query) {
  const sheet = getTargetSheet();
  CARDS_BY_LAST4 = loadCards(sheet.getParent());
  CATEGORY_OVERRIDES = loadCategoryOverrides(sheet.getParent());
  ensureHeaders(sheet);

  const label = GmailApp.getUserLabelByName(SYNC_CONFIG.PROCESSED_LABEL) ||
    GmailApp.createLabel(SYNC_CONFIG.PROCESSED_LABEL);
  const existing = readExistingRows(sheet);
  const threads = GmailApp.search(query, 0, 100);
  const newRows = [];

  for (const thread of threads) {
    for (const msg of thread.getMessages()) {
      const tx = parseTransactionEmail(
        msg.getFrom() || '', msg.getSubject() || '', msg.getPlainBody() || '', msg.getBody() || '', msg.getDate());
      if (!tx) continue;
      const match = findExisting(tx, existing);
      if (match) {
        // Alert rows are rewritten when a newer parser reads the same email better.
        if (match.source === 'alert' && match.row && match.description !== tx.description) {
          sheet.getRange(match.row, 2).setValue(tx.description);
          sheet.getRange(match.row, 4).setValue(tx.category);
          match.description = tx.description;
        }
        continue;
      }
      existing.push({ date: tx.date, amount: tx.amount, card: tx.card });
      newRows.push([tx.date, tx.description, tx.amount, tx.category, tx.card, tx.type, 'alert']);
    }
    // Labelled even when nothing parsed, so marketing mail matching the query is not rescanned.
    thread.addLabel(label);
  }

  if (newRows.length > 0) {
    sheet.insertRowsAfter(1, newRows.length);
    sheet.getRange(2, 1, newRows.length, HEADERS.length).setValues(newRows);
    sortNewestFirst(sheet);
  }
  Logger.log('Scanned ' + threads.length + ' thread(s); added ' + newRows.length + ' row(s).');
  // Mirror the sheet into Firestore for the app (Firestore.gs). A failure here must not stop the
  // alert sync, which is the source of truth.
  try { mirrorSheetToFirestore(); } catch (e) { Logger.log('Firestore mirror failed: ' + e); }
  return { added: newRows.length, threadsScanned: threads.length };
}

function parseTransactionEmail(from, subject, body, htmlBody, dateObj) {
  const text = subject + '\n' + body;

  if (/payment thank you|autopay|automatic payment|payment received|we received your payment|thank you for your payment/i.test(text)) {
    return null;
  }

  const amountMatch =
    text.match(/\$\s?([0-9,]+\.[0-9]{2})/) ||
    text.match(/([0-9,]+\.[0-9]{2})\s*USD/i);
  const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
  if (!amount || isNaN(amount)) return null;

  const isRobinhood = /robinhood\.com/i.test(from);
  const isChase = /chase\.com/i.test(from);
  let description;
  if (isRobinhood) description = extractRobinhoodMerchant(body, subject);
  else if (isChase) description = extractMerchant(body, htmlBody, subject, 'Chase Card Purchase');
  else description = extractMerchant(body, htmlBody, subject, 'Visa Card Purchase');

  // Only the alert's wording marks a refund. "AMAZON MKTPLACE PMTS" is how Chase alerts name an
  // ordinary Amazon purchase; statements later show the same charge as "AMAZON MKTPL*<id>".
  const isRefund = /\brefund|\bcredit (?:of|for|to)|\breturn(?:ed)?\b|merchant credit/i.test(text);

  return {
    date: Utilities.formatDate(dateObj, Session.getScriptTimeZone() || 'GMT', 'yyyy-MM-dd'),
    description: description,
    amount: isRefund ? -amount : amount,
    category: classifyCategory(description),
    card: identifyCard(from + '\n' + text, isRobinhood),
    type: isRefund ? 'Return' : 'Sale',
  };
}

function identifyCard(text, isRobinhood) {
  const last4 = text.match(/(?:ending|ends)\s+in\s+(\d{4})|\(\.{2,3}\s?(\d{4})\)|x{2,}(\d{4})|\bon card\s+(\d{4})/i);
  const digits = last4 && (last4[1] || last4[2] || last4[3] || last4[4]);
  if (digits && CARDS_BY_LAST4[digits]) return CARDS_BY_LAST4[digits];
  if (isRobinhood) return 'Robinhood';
  for (const [pattern, name] of CARD_KEYWORDS) {
    if (pattern.test(text)) return name;
  }
  return digits ? 'Card ...' + digits : 'Unknown Card';
}

function extractRobinhoodMerchant(body, subject) {
  const m =
    body.match(/spent\s+\$[0-9.,]+\s+at\s+([A-Za-z0-9 &.,'’\-*#]+?)(?:\s+with|\s+on|\.|\n|<)/i) ||
    body.match(/(?:Merchant|Payee)\s*[:\n\r]+\s*([A-Za-z0-9 &.,'’\-*#]+)/i) ||
    subject.match(/spent\s+\$[0-9.,]+\s+at\s+([A-Za-z0-9 &.,'’\-*#]+)/i);
  return m && m[1] ? cleanMerchantName(m[1]) : 'Robinhood Purchase';
}

function extractMerchant(body, htmlBody, subject, fallback) {
  const text = (subject || '') + '\n' + (body || '');
  const html = htmlBody || '';
  const isLabel = (s) => /Amount|Date|Account|\$|Card ending/i.test(s);

  const labelled = text.match(/(?:Merchant|Payee|Where|Vendor|Store)\s*[:\n\r]+\s*([^\r\n<]+)/i);
  if (labelled && labelled[1].trim() && !isLabel(labelled[1])) return cleanMerchantName(labelled[1]);

  const cell = html.match(/(?:Merchant|Payee|Store|Vendor)[\s\S]*?<td[^>]*>([^<]+)<\/td>/i);
  if (cell && cell[1].trim() && !isLabel(cell[1])) return cleanMerchantName(cell[1]);

  // Visa Purchase Alerts: "77.77 USD at MERCHANT in LOCATION on Card 1234" (subject) or
  // "used ... at MERCHANT in LOCATION, USA for 77.77 USD" (body). The location follows " in ".
  const visa = text.match(/USD at (.+?) in [^\n]+? on Card \d{4}/i) || text.match(/\bat (.+?) in [^\n]+?, [A-Z]{2,3} for [0-9.,]+ USD/);
  if (visa && visa[1].trim()) return cleanMerchantName(visa[1]);

  // Refunds: "a refund of $18.00 from MERCHANT", "You have a $18.00 refund from MERCHANT".
  const refundFrom = text.match(/(?:refund|credit)(?:\s+of\s+\$[0-9.,]+)?\s+from\s+([^\r\n<]+?)(?:\s+(?:was|on|to)\b|\.\s|\n|<|$)/i);
  if (refundFrom && refundFrom[1].trim() && !isLabel(refundFrom[1])) return cleanMerchantName(refundFrom[1]);

  // Chase: "You made a $27.10 transaction with AMAZON MKTPLACE PMTS".
  const withMerchant = text.match(/transaction\s+with\s+([^\r\n<]+?)(?:\s+(?:on\b|using\b|was\b)|\.\s|\n|<|$)/i);
  if (withMerchant && withMerchant[1].trim() && !isLabel(withMerchant[1])) return cleanMerchantName(withMerchant[1]);

  const at = text.match(/(?:purchase|transaction|charge|spent|used for).*?\bat\s+([A-Za-z0-9 &.,'’\-*#]+?)(?:\s+(?:on|with|using|for|was|has|is)\b|\.|\n|<|\$|\d{1,2}\/\d{1,2})/i);
  if (at && at[1].trim() && !/\b(?:visa|chase|card)\b/i.test(at[1])) return cleanMerchantName(at[1]);

  const subj = (subject || '').match(/\bat\s+([A-Za-z0-9 &.,'’\-*#]+?)(?:\s+(?:on\b|with\b)|\.|\$|$)/i);
  if (subj && subj[1].trim()) return cleanMerchantName(subj[1]);

  return fallback;
}

// Household-specific merchant -> category rules from the Sheet's "Categories" tab
// (Merchant contains | Category), checked before the built-in rules below. Data, not code.
let CATEGORY_OVERRIDES = [];

function loadCategoryOverrides(ss) {
  const tab = ss.getSheetByName(SYNC_CONFIG.CATEGORIES_SHEET_NAME);
  if (!tab || tab.getLastRow() < 2) return [];
  return tab.getRange(2, 1, tab.getLastRow() - 1, 2).getValues()
    .map(([needle, category]) => [String(needle).trim().toLowerCase(), String(category).trim()])
    .filter(([needle, category]) => needle && category);
}

// Same vocabulary Chase uses in statement exports, so alert and statement rows share categories.
function classifyCategory(merchant) {
  const m = merchant.toLowerCase();
  for (const [needle, category] of CATEGORY_OVERRIDES) {
    if (m.includes(needle)) return category;
  }
  // Built-in rules use national chains and generic words only; anything local or personal belongs
  // in the Sheet's Categories tab, which is checked first.
  // Before Shopping: "amazon web services" would otherwise match "amazon".
  if (/netflix|spotify|hulu|disney\+|comcast|xfinity|verizon|t-mobile|utility|electric|water bill|aws|amazon web services|insurance/.test(m)) return 'Bills & Utilities';
  if (/mktplace pmts|prime pmts|amazon|target|walmart|etsy|best buy|nike|macy/.test(m)) return 'Shopping';
  if (/whole ?foods|wholefds|trader joe|safeway|kroger|costco|aldi|grocery|supermarket/.test(m)) return 'Groceries';
  if (/doordash|uber ?eats|grubhub|starbucks|mcdonald|chipotle|cafe|coffee|restaurant|pizza|taco|burger|bakery/.test(m)) return 'Food & Drink';
  if (/chevron|shell|exxon|mobil|\bbp\b|circle k|fuel/.test(m)) return 'Gas';
  if (/airline|airways|lyft|uber(?! ?eats)|airbnb|hotel|motel|parking|toll/.test(m)) return 'Travel';
  if (/home depot|lowe'?s|ikea|wayfair/.test(m)) return 'Home';
  // Before Health: "veterinary clinic" would otherwise match it.
  if (/\bvet\b|veterinar|salon|nail|barber|spa/.test(m)) return 'Personal';
  if (/cvs|walgreens|pharmacy|clinic|hospital|medical|doctor|dental/.test(m)) return 'Health & Wellness';
  if (/amc|cinema|theater|ticket/.test(m)) return 'Entertainment';
  return 'Shopping';
}

function cleanMerchantName(raw) {
  let s = String(raw || '').trim().replace(/<[^>]*>/g, '').replace(/^(?:at|with|purchase at|charged at)\s+/i, '');
  s = s.replace(/\s+(?:on\s+[A-Za-z]+|on\s+\d{1,2}\/|with your card|with card|\.|\$|\().*$/i, '');
  return s.trim() || 'Card Purchase';
}

function matchesExisting(tx, existing) {
  return findExisting(tx, existing) !== undefined;
}

function findExisting(tx, existing) {
  const windowMs = SYNC_CONFIG.MATCH_WINDOW_DAYS * 86400000;
  const t = Date.parse(tx.date);
  return existing.find((row) =>
    row.card === tx.card &&
    Math.abs(row.amount - tx.amount) < 0.005 &&
    Math.abs(Date.parse(row.date) - t) <= windowMs);
}

function readExistingRows(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const tz = Session.getScriptTimeZone() || 'GMT';
  return sheet.getRange(2, 1, lastRow - 1, 7).getValues().map((r, i) => ({
    row: i + 2,
    date: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).trim(),
    description: String(r[1] || ''),
    amount: parseFloat(r[2]) || 0,
    card: String(r[4] || '').trim(),
    source: String(r[6] || ''),
  }));
}

function getTargetSheet() {
  const ss = SYNC_CONFIG.SPREADSHEET_ID
    ? SpreadsheetApp.openById(SYNC_CONFIG.SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SYNC_CONFIG.SHEET_NAME) || ss.getSheets()[0];
}

function ensureHeaders(sheet) {
  const current = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  if (current.join('|') !== HEADERS.join('|')) {
    // Only fills blanks, so an existing six-column sheet gains the Source column without renaming anything.
    const merged = HEADERS.map((h, i) => current[i] || h);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([merged]).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
}

/** Run from the editor to re-sort every row newest first. */
function sortNewestFirst(targetSheet) {
  const sheet = targetSheet || getTargetSheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 2) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).sort({ column: 1, ascending: false });
  }
}

/** Run once from the editor: installs the 15-minute trigger and runs a first sync. */
function setupAutoSyncTrigger() {
  for (const trigger of ScriptApp.getProjectTriggers()) {
    if (trigger.getHandlerFunction() === 'syncCardTransactionsFromGmail') ScriptApp.deleteTrigger(trigger);
  }
  ScriptApp.newTrigger('syncCardTransactionsFromGmail').timeBased().everyMinutes(15).create();
  syncCardTransactionsFromGmail();
}
