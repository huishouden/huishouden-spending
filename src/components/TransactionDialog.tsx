import { useState } from 'react';
import type { SpendingStore } from '../data/store';
import type { SpendingRecord } from '../data/model';
import { categoryChoices } from './SettingsModal';
import { Dialog, ghostButton, hintClass, inputClass, labelClass, primaryButton, secondaryButton } from './ui';

/** The words of a description worth a rule: "EXAMPLE NOODLE BAR #12 SPRINGFIELD" → "example noodle bar". */
export function rulePhrase(description: string): string {
  const words = description
    .toLowerCase()
    .replace(/[#*].*$/, '')
    .replace(/[^a-z&'\s.-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
  return words.slice(0, 3).join(' ');
}

interface Props {
  record: SpendingRecord;
  store: SpendingStore;
  onClose: () => void;
  onDone: (message: string) => void;
}

/** One transaction: change its category (and, if wanted, every later one like it), or remove it. */
export function TransactionDialog({ record, store, onClose, onDone }: Props) {
  const [category, setCategory] = useState(record.category);
  const [remember, setRemember] = useState(false);
  const [phrase, setPhrase] = useState(rulePhrase(record.description));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const symbol = store.settings.currencySymbol;

  const save = async () => {
    if (category.trim() && category !== record.category) await store.actions.recategorise(record, category.trim());
    if (remember && phrase.trim()) await store.actions.saveRule({ contains: phrase.trim().toLowerCase(), category: category.trim() });
    onDone(remember ? `Saved; new charges from ${phrase.trim()} go to ${category.trim()}` : 'Saved');
    onClose();
  };
  const remove = async () => {
    await store.actions.deleteTransaction(record.id);
    onDone(`Removed ${record.description}`);
    onClose();
  };

  return (
    <Dialog
      title={record.description}
      onClose={onClose}
      footer={
        confirmDelete ? (
          <>
            <span className="mr-auto text-sm">Remove this transaction for everyone in the household?</span>
            <button type="button" className={ghostButton} onClick={() => setConfirmDelete(false)}>
              Keep
            </button>
            <button type="button" className={secondaryButton} onClick={remove}>
              Remove
            </button>
          </>
        ) : (
          <>
            <button type="button" className={`${ghostButton} mr-auto`} onClick={() => setConfirmDelete(true)}>
              Remove
            </button>
            <button type="button" className={ghostButton} onClick={onClose}>
              Cancel
            </button>
            <button type="button" className={primaryButton} onClick={save} disabled={!category.trim()}>
              Save
            </button>
          </>
        )
      }
    >
      <dl className="mb-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
        <dt className="text-stone-600 dark:text-stone-300">Date</dt>
        <dd className="tabular-nums">{record.date}</dd>
        <dt className="text-stone-600 dark:text-stone-300">Amount</dt>
        <dd className="tabular-nums">
          {record.amount < 0 ? '−' : ''}
          {symbol}
          {Math.abs(record.amount).toFixed(2)}
        </dd>
        <dt className="text-stone-600 dark:text-stone-300">Card</dt>
        <dd>{record.card}</dd>
        <dt className="text-stone-600 dark:text-stone-300">From</dt>
        <dd>{record.source === 'alert' ? 'A card alert email' : 'A statement'}</dd>
      </dl>
      <label className={labelClass} htmlFor="tx-category">
        Category
      </label>
      <input id="tx-category" className={inputClass} list="tx-category-choices" value={category} maxLength={60} onChange={(e) => setCategory(e.target.value)} />
      <datalist id="tx-category-choices">
        {categoryChoices(store.rules, [record.category]).map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <label className="mt-4 flex min-h-11 items-center gap-3">
        <input type="checkbox" className="h-5 w-5 accent-forest-700" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Use this category for every charge whose name contains
      </label>
      {remember && (
        <>
          <input className={inputClass} value={phrase} aria-label="Name contains" maxLength={80} onChange={(e) => setPhrase(e.target.value)} />
          <p className={hintClass}>Applies to charges brought in from now on.</p>
        </>
      )}
    </Dialog>
  );
}
