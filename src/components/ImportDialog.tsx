import { useMemo, useRef, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import type { SpendingStore } from '../data/store';
import { cardFromFileName, detectMapping, mappingFits, parseStatement, readCsv, type CsvFile, type CsvMapping, type StatementRow } from '../lib/csvImport';
import { Dialog, ghostButton, iconButton, inputClass, primaryButton, secondaryButton, selectClass } from '@huishouden/pwa-kit/react/ui';
import { shortDate } from '@huishouden/pwa-kit/time';
import { cents, money } from '../lib/month';

const labelClass = 'mb-1.5 block text-sm font-medium text-stone-700';

/**
 * Statement files (CSV) from any bank or card into the household's transactions. Columns are found
 * from the file's headers (or the ones remembered for its card) and can be corrected; the preview
 * says what is new before anything is written.
 */

const NEW_CARD = '__new';

const missingColumns = (m: CsvMapping) =>
  [!m.date && 'date', !m.description && 'description', !m.amount && !(m.debit && m.credit) && 'amount'].filter((x): x is string => !!x);

interface Loaded {
  key: string;
  fileName: string;
  file: CsvFile;
  mapping: CsvMapping | null;
  missing: string[];
  cardId: string;
  newCard: { name: string; last4: string };
}

interface Props {
  onClose: () => void;
  store: SpendingStore;
  onDone: (message: string) => void;
}

export function ImportDialog({ onClose, store, onDone }: Props) {
  const [files, setFiles] = useState<Loaded[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const cardName = (f: Loaded) => (f.cardId === NEW_CARD ? f.newCard.name.trim() : store.cards.find((c) => c.id === f.cardId)?.name ?? '');

  const parsed = useMemo(
    () =>
      files.map((f) =>
        f.mapping && missingColumns(f.mapping).length === 0 && cardName(f)
          ? parseStatement(f.file, f.mapping, {
              card: cardName(f),
              cards: [...store.cards, ...(f.cardId === NEW_CARD && /^\d{4}$/.test(f.newCard.last4) ? [{ name: f.newCard.name.trim(), last4: f.newCard.last4 }] : [])],
              rules: store.rules,
              ignoredKeywords: store.settings.ignoredKeywords,
            })
          : null,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [files, store.cards, store.rules, store.settings.ignoredKeywords],
  );
  const plan = useMemo(() => store.actions.planStatements(parsed.map((p) => p?.rows ?? [])), [parsed, store.actions, store.records]);
  const perFile = (i: number) => ({
    added: plan.create.filter((r) => r.group === i).length,
    replaced: plan.replace.filter((r) => r.tx.group === i).length,
  });

  const load = async (list: FileList | null) => {
    setError(null);
    const next: Loaded[] = [];
    for (const f of Array.from(list ?? [])) {
      const file = readCsv(await f.text());
      if (file.headers.length === 0) {
        setError(`${f.name} has no rows.`);
        continue;
      }
      const card = cardFromFileName(f.name, store.cards);
      const remembered = card?.csv && mappingFits(card.csv, file.headers) ? card.csv : null;
      const detected = remembered ? { mapping: remembered, missing: [] } : detectMapping(file);
      const digits = f.name.match(/\d{4}(?=\D*$)/)?.[0] ?? '';
      next.push({
        key: `${f.name}-${f.size}-${f.lastModified}`,
        fileName: f.name,
        file,
        ...detected,
        cardId: card?.id ?? (store.cards.length === 1 ? store.cards[0].id : store.cards.length === 0 ? NEW_CARD : ''),
        newCard: { name: '', last4: card ? '' : digits },
      });
    }
    setFiles((prev) => [...prev, ...next.filter((n) => !prev.some((p) => p.key === n.key))]);
    if (input.current) input.current.value = '';
  };

  const update = (i: number, patch: Partial<Loaded>) => setFiles((prev) => prev.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const setMapping = (i: number, patch: Partial<CsvMapping>) => {
    const f = files[i];
    const base: CsvMapping = f.mapping ?? { date: '', description: '', purchases: 'negative', dayFirst: false };
    const next = { ...base, ...patch };
    update(i, { mapping: next, missing: missingColumns(next) });
  };

  const ready = files.length > 0 && files.every((f, i) => parsed[i] && cardName(f));
  const total = plan.create.length + plan.replace.length;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const batches: { rows: StatementRow[]; remember?: { cardId: string; mapping: CsvMapping } }[] = [];
      for (const [i, f] of files.entries()) {
        let cardId = f.cardId;
        if (cardId === NEW_CARD) cardId = await store.actions.saveCard(null, { name: f.newCard.name.trim(), last4: f.newCard.last4 || undefined, alertWords: [] });
        batches.push({ rows: parsed[i]!.rows, remember: { cardId, mapping: f.mapping! } });
      }
      const r = await store.actions.importStatements(batches);
      const parts = [`Added ${r.added} purchase${r.added === 1 ? '' : 's'}`];
      if (r.replaced) parts.push(`${r.replaced} email alert${r.replaced === 1 ? '' : 's'} replaced by the statement`);
      if (r.duplicates) parts.push(`${r.duplicates} already here`);
      onDone(parts.join('; '));
      setFiles([]);
      onClose();
    } catch (e) {
      setError((e as Error).message || "Couldn't add the purchases.");
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <button type="button" className={ghostButton} onClick={onClose}>
        Cancel
      </button>
      <button type="button" className={primaryButton} disabled={!ready || busy || total === 0} onClick={save}>
        {total === 0 && ready ? 'Nothing new to add' : `Add ${total} purchase${total === 1 ? '' : 's'}`}
      </button>
    </>
  );

  return (
    <Dialog title="Import a statement" onClose={onClose} footer={footer}>
      <div className="space-y-5">
        <p className="text-stone-600">Download your card’s or bank’s activity as a CSV file from its website, then choose it here. Anything already here is left out.</p>
        <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-stone-200 p-5 text-center hover:border-forest-400">
          <FileUp size={24} className="text-forest-700" />
          <span className="font-medium">Choose statement files</span>
          <span className="text-sm text-stone-600">CSV, one or more</span>
          <input ref={input} type="file" accept=".csv,text/csv" multiple className="sr-only" aria-label="Statement files" onChange={(e) => void load(e.target.files)} />
        </label>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}

        {files.map((f, i) => {
          const result = parsed[i];
          const counts = perFile(i);
          const cols = f.file.headers;
          const colSelect = (label: string, key: keyof CsvMapping, optional = false) => (
            <div>
              <label className={labelClass} htmlFor={`${f.key}-${key}`}>
                {label}
              </label>
              <select id={`${f.key}-${key}`} className={selectClass} value={(f.mapping?.[key] as string | undefined) ?? ''} onChange={(e) => setMapping(i, { [key]: e.target.value || undefined })}>
                <option value="">{optional ? 'None' : 'Choose a column'}</option>
                {cols.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          );
          const split = !!f.mapping && !f.mapping.amount && (!!f.mapping.debit || !!f.mapping.credit);
          return (
            <section key={f.key} aria-label={f.fileName} className="space-y-4 rounded-2xl border border-stone-200 p-4">
              <div className="flex items-center gap-3">
                <h3 className="min-w-0 flex-1 truncate font-semibold">{f.fileName}</h3>
                <button type="button" className={iconButton} aria-label={`Remove ${f.fileName}`} onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor={`${f.key}-card`}>
                    Card
                  </label>
                  <select id={`${f.key}-card`} className={selectClass} value={f.cardId} onChange={(e) => update(i, { cardId: e.target.value })}>
                    <option value="" disabled>
                      Choose the card
                    </option>
                    {store.cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.last4 ? ` (${c.last4})` : ''}
                      </option>
                    ))}
                    <option value={NEW_CARD}>A new card</option>
                  </select>
                </div>
                {f.cardId === NEW_CARD && (
                  <div className="grid grid-cols-[2fr_1fr] gap-3">
                    <div>
                      <label className={labelClass} htmlFor={`${f.key}-new-name`}>
                        Card name
                      </label>
                      <input id={`${f.key}-new-name`} className={inputClass} value={f.newCard.name} maxLength={60} placeholder="Card One" onChange={(e) => update(i, { newCard: { ...f.newCard, name: e.target.value } })} />
                    </div>
                    <div>
                      <label className={labelClass} htmlFor={`${f.key}-new-last4`}>
                        Last 4
                      </label>
                      <input id={`${f.key}-new-last4`} className={`${inputClass} tabular-nums`} inputMode="numeric" maxLength={4} value={f.newCard.last4} onChange={(e) => update(i, { newCard: { ...f.newCard, last4: e.target.value.replace(/\D/g, '') } })} />
                    </div>
                  </div>
                )}
              </div>

              <details open={!f.mapping || f.missing.length > 0} className="rounded-xl bg-stone-100 px-4 py-3">
                <summary className="min-h-8 cursor-pointer font-medium">
                  {f.mapping && f.missing.length === 0
                    ? `Columns: ${f.mapping.date}, ${f.mapping.description}, ${f.mapping.amount ?? `${f.mapping.debit} and ${f.mapping.credit}`}${f.mapping.amount ? `; purchases are ${f.mapping.purchases}` : ''}`
                    : `Choose the ${f.missing.join(', ')} column${f.missing.length === 1 ? '' : 's'}`}
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {colSelect('Date', 'date')}
                  {colSelect('Description', 'description')}
                  {split ? (
                    <>
                      {colSelect('Money out', 'debit')}
                      {colSelect('Money in', 'credit')}
                    </>
                  ) : (
                    colSelect('Amount', 'amount')
                  )}
                  {colSelect('Category (optional)', 'category', true)}
                  {!split && (
                    <div>
                      <p className={labelClass}>Purchases in the amount column are</p>
                      <div className="flex gap-4">
                        {(['negative', 'positive'] as const).map((s) => (
                          <label key={s} className="flex min-h-11 items-center gap-2">
                            <input type="radio" className="h-5 w-5 accent-forest-700" name={`${f.key}-sign`} checked={f.mapping?.purchases === s} onChange={() => setMapping(i, { purchases: s })} />
                            {s === 'negative' ? 'Negative (−12.50)' : 'Positive (12.50)'}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="checkbox" className="h-5 w-5 accent-forest-700" checked={!!f.mapping?.dayFirst} onChange={(e) => setMapping(i, { dayFirst: e.target.checked })} />
                    Dates are day first (31/01/2031)
                  </label>
                </div>
                <p className="mt-2 text-sm text-stone-600">These columns are remembered for the card.</p>
              </details>

              {result && (
                <div className="space-y-2">
                  <p aria-live="polite">
                    {counts.added} new
                    {counts.replaced ? `, ${counts.replaced} replacing email alerts` : ''}
                    {`, ${result.rows.length - counts.added - counts.replaced} already here`}
                    {result.skipped ? `; ${result.skipped} skipped (card payments and never-counted words)` : ''}
                    {result.unreadable.length ? `; row${result.unreadable.length === 1 ? '' : 's'} ${result.unreadable.join(', ')} couldn't be read` : ''}.
                  </p>
                  <table className="w-full text-sm">
                    <caption className="sr-only">First rows of {f.fileName}</caption>
                    <tbody className="divide-y divide-stone-200">
                      {result.rows.slice(0, 5).map((r) => (
                        <tr key={r.row}>
                          <td className="py-1.5 pr-3 whitespace-nowrap text-stone-600 tabular-nums">{shortDate(r.date)}</td>
                          <td className="py-1.5 pr-3">{r.description}</td>
                          <td className="py-1.5 pr-3 text-stone-600">{r.category}</td>
                          <td className="py-1.5 text-right tabular-nums">{money(cents(r.amount), store.settings.currencySymbol)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!cardName(f) && <p className="text-sm text-terracotta-dark">Choose the card this file is for.</p>}
            </section>
          );
        })}
        {files.length > 0 && (
          <button type="button" className={secondaryButton} onClick={() => input.current?.click()}>
            Add another file
          </button>
        )}
      </div>
    </Dialog>
  );
}
