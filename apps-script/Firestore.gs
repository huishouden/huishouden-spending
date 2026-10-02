/**
 * Mirrors the spending Sheet into Firestore so the dashboard can read it with a long-lived
 * Firebase sign-in instead of an hourly Google Sheets token.
 *
 *   households/{householdId}/spendingTransactions/{txId}
 *     date, description, amount, category, card, type, source, updatedAt
 *
 * The Sheet stays the source of truth: every run upserts changed rows and deletes documents
 * whose row is gone. Only changed rows are written (fingerprints kept in Script Properties),
 * so a steady state costs one read of the Sheet and no Firestore writes.
 *
 * Writes use the script owner's OAuth token. The owner has IAM access to the project, so these
 * writes bypass security rules. Members' browsers write this collection too (statement imports,
 * card alerts); the mirror only updates and deletes documents it wrote (its fingerprint state).
 *
 * Household: Script Property SPENDING_HOUSEHOLD_ID, or the only household document if there is
 * exactly one (then remembered in that property).
 */

const FIRESTORE_CONFIG = {
  PROJECT_ID: 'huishouden-piekstra',
  COLLECTION: 'spendingTransactions',
  // Firestore commit accepts at most 500 writes.
  BATCH_SIZE: 500,
  // Script Properties values are capped at 9 KB; the fingerprint map is split across keys.
  PROPERTY_CHUNK_CHARS: 8000,
  HOUSEHOLD_PROPERTY: 'SPENDING_HOUSEHOLD_ID',
  MIRROR_PROPERTY_PREFIX: 'FS_MIRROR_',
};

const FIRESTORE_BASE =
  'https://firestore.googleapis.com/v1/projects/' + FIRESTORE_CONFIG.PROJECT_ID + '/databases/(default)/documents';

// ---------------------------------------------------------------------------------------------
// Pure helpers (unit-tested in Firestore.test.ts; no Apps Script services).
// ---------------------------------------------------------------------------------------------

/** cyrb53: fast, stable 53-bit string hash; rendered base-36. Not cryptographic. */
function stableHash(str, seed) {
  let h1 = 0xdeadbeef ^ (seed || 0);
  let h2 = 0x41c6ce57 ^ (seed || 0);
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/**
 * Sheet rows (row 2 onward: Date as yyyy-MM-dd, Description, Amount, Category, Card, Type, Source)
 * to documents. The id depends on date, description, amount and card only, so editing a row's
 * category or type updates the same document. Identical rows (two identical parking charges on one
 * day) get an occurrence suffix so neither is lost.
 */
function rowsToDocs(rows) {
  const seen = {};
  const docs = [];
  for (const r of rows) {
    const date = String(r[0] || '').trim();
    const description = String(r[1] || '').trim();
    const amount = Number(String(r[2]).replace(/[$,\s]/g, ''));
    if (!date || !description || isNaN(amount)) continue;
    const card = String(r[4] || '').trim();
    const key = [date, description, amount.toFixed(2), card].join('|');
    const occurrence = seen[key] || 0;
    seen[key] = occurrence + 1;
    const fields = {
      date: date,
      description: description,
      amount: Math.round(amount * 100) / 100,
      category: String(r[3] || '').trim(),
      card: card,
      type: String(r[5] || '').trim(),
      source: String(r[6] || '').trim() || 'statement',
    };
    docs.push({
      id: stableHash(key) + (occurrence ? '-' + occurrence : ''),
      fields: fields,
      fingerprint: stableHash(JSON.stringify(fields)),
    });
  }
  return docs;
}

/** What to write given the documents now and the fingerprints from the last successful run. */
function planMirror(docs, previous) {
  const upserts = [];
  const current = {};
  for (const d of docs) {
    current[d.id] = true;
    if (previous[d.id] !== d.fingerprint) upserts.push(d);
  }
  const deletes = Object.keys(previous).filter((id) => !current[id]);
  return { upserts: upserts, deletes: deletes };
}

/** Plain values to Firestore REST field encoding. */
function toFirestoreFields(fields, updatedAtIso) {
  const out = {};
  for (const k of Object.keys(fields)) {
    const v = fields[k];
    out[k] = typeof v === 'number' ? { doubleValue: v } : { stringValue: String(v) };
  }
  out.updatedAt = { timestampValue: updatedAtIso };
  return out;
}

/** Split a string into chunks of at most `size` characters. */
function chunkString(str, size) {
  const chunks = [];
  for (let i = 0; i < str.length; i += size) chunks.push(str.slice(i, i + size));
  return chunks.length ? chunks : [''];
}

// ---------------------------------------------------------------------------------------------
// Apps Script side.
// ---------------------------------------------------------------------------------------------

/** Call at the end of each sync (and safe to run by hand). Returns counts for the log. */
function mirrorSheetToFirestore() {
  const householdId = getSpendingHouseholdId();
  const sheet = getTargetSheet();
  const lastRow = sheet.getLastRow();
  const tz = Session.getScriptTimeZone() || 'GMT';
  const rows = lastRow < 2 ? [] : sheet.getRange(2, 1, lastRow - 1, 7).getValues().map((r) => {
    const copy = r.slice();
    if (copy[0] instanceof Date) copy[0] = Utilities.formatDate(copy[0], tz, 'yyyy-MM-dd');
    return copy;
  });

  const docs = rowsToDocs(rows);
  const previous = loadMirrorState();
  const plan = planMirror(docs, previous);
  const prefix = 'projects/' + FIRESTORE_CONFIG.PROJECT_ID + '/databases/(default)/documents/households/' +
    householdId + '/' + FIRESTORE_CONFIG.COLLECTION + '/';
  const now = new Date().toISOString();

  const writes = plan.upserts.map((d) => ({
    write: { update: { name: prefix + d.id, fields: toFirestoreFields(d.fields, now) } },
    apply: (state) => { state[d.id] = d.fingerprint; },
  })).concat(plan.deletes.map((id) => ({
    write: { delete: prefix + id },
    apply: (state) => { delete state[id]; },
  })));

  // Commit batch by batch and record progress after each, so a failure part-way re-sends only
  // what did not land.
  const state = Object.assign({}, previous);
  for (let i = 0; i < writes.length; i += FIRESTORE_CONFIG.BATCH_SIZE) {
    const batch = writes.slice(i, i + FIRESTORE_CONFIG.BATCH_SIZE);
    firestoreRequest('post', FIRESTORE_BASE + ':commit', { writes: batch.map((w) => w.write) });
    batch.forEach((w) => w.apply(state));
    saveMirrorState(state);
  }

  if (writes.length) {
    Logger.log('Firestore mirror: ' + plan.upserts.length + ' upserted, ' + plan.deletes.length + ' deleted.');
  }
  return { upserted: plan.upserts.length, deleted: plan.deletes.length, total: docs.length };
}

/** Run from the editor to rewrite every document (after a schema change or a manual wipe). */
function resetFirestoreMirror() {
  saveMirrorState({});
  return mirrorSheetToFirestore();
}

function getSpendingHouseholdId() {
  const props = PropertiesService.getScriptProperties();
  const configured = props.getProperty(FIRESTORE_CONFIG.HOUSEHOLD_PROPERTY);
  if (configured) return configured;

  const res = firestoreRequest('get', FIRESTORE_BASE + '/households?pageSize=2&mask.fieldPaths=name');
  const docs = (res && res.documents) || [];
  if (docs.length !== 1) {
    throw new Error(
      'Found ' + docs.length + ' household documents; set Script Property ' +
      FIRESTORE_CONFIG.HOUSEHOLD_PROPERTY + ' to the household id the spending data belongs to.');
  }
  const id = docs[0].name.split('/').pop();
  props.setProperty(FIRESTORE_CONFIG.HOUSEHOLD_PROPERTY, id);
  return id;
}

function firestoreRequest(method, url, body) {
  const res = UrlFetchApp.fetch(url, {
    method: method,
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    payload: body ? JSON.stringify(body) : undefined,
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code >= 300) throw new Error('Firestore ' + method.toUpperCase() + ' ' + code + ': ' + text.slice(0, 500));
  return text ? JSON.parse(text) : null;
}

function loadMirrorState() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const keys = Object.keys(props)
    .filter((k) => k.indexOf(FIRESTORE_CONFIG.MIRROR_PROPERTY_PREFIX) === 0)
    .sort((a, b) => Number(a.slice(FIRESTORE_CONFIG.MIRROR_PROPERTY_PREFIX.length)) -
      Number(b.slice(FIRESTORE_CONFIG.MIRROR_PROPERTY_PREFIX.length)));
  if (!keys.length) return {};
  try {
    return JSON.parse(keys.map((k) => props[k]).join(''));
  } catch (e) {
    // A corrupt map only costs a full rewrite.
    return {};
  }
}

function saveMirrorState(state) {
  const props = PropertiesService.getScriptProperties();
  const existing = Object.keys(props.getProperties())
    .filter((k) => k.indexOf(FIRESTORE_CONFIG.MIRROR_PROPERTY_PREFIX) === 0);
  const chunks = chunkString(JSON.stringify(state), FIRESTORE_CONFIG.PROPERTY_CHUNK_CHARS);
  const values = {};
  chunks.forEach((c, i) => { values[FIRESTORE_CONFIG.MIRROR_PROPERTY_PREFIX + i] = c; });
  props.setProperties(values, false);
  existing.forEach((k) => { if (!(k in values)) props.deleteProperty(k); });
}
