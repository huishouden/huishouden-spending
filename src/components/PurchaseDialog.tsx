import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { longDate, type Ymd } from '@huishouden/pwa-kit/time';
import { Checkbox, Chip, deleteButton, Dialog, ghostButton, inputClass, primaryButton } from '@huishouden/pwa-kit/react/ui';
import type { SpendingStore } from '../data/store';
import { ruleId, type SpendingRecord } from '../data/model';
import { categoryChoices, cents, money, rulePhrase } from '../lib/month';

interface Props {
  record: SpendingRecord;
  store: SpendingStore;
  today: Ymd;
  notify: (message: string, undo?: () => void) => void;
  onClose: () => void;
}

/** One purchase: put it in another category (and, if wanted, every later one from the same shop), or remove it. */
export function PurchaseDialog({ record, store, today, notify, onClose }: Props) {
  const [category, setCategory] = useState(record.category);
  const [always, setAlways] = useState(false);
  const phrase = rulePhrase(record.description);
  const choices = categoryChoices(store.rules, [record.category]);
  const chosen = category.trim();
  const { actions } = store;

  const save = () => {
    const moved = chosen !== record.category;
    if (moved) void actions.recategorise(record, chosen);
    const rule = always && phrase ? { contains: phrase, category: chosen } : null;
    const before = rule ? store.rules.find((r) => r.id === ruleId(phrase)) : undefined;
    if (rule) void actions.saveRule(rule);
    onClose();
    if (!moved && !rule) return;
    const undo = () => {
      if (moved) void actions.recategorise({ ...record, category: chosen }, record.category);
      if (rule) void (before ? actions.saveRule(before) : actions.deleteRule(ruleId(phrase)));
    };
    notify(moved ? `Moved ${record.description} to ${chosen}` : `${record.description} will always go in ${chosen}`, undo);
  };

  const remove = () => {
    void actions.deleteTransaction(record.id);
    onClose();
    // Writing the purchase back as it was puts it back.
    notify(`Removed ${record.description}`, () => void actions.recategorise(record, record.category));
  };

  return (
    <Dialog
      title={record.description}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={deleteButton} onClick={remove}>
            <Trash2 size={18} /> Remove
          </button>
          <button type="button" className={ghostButton} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={primaryButton} onClick={save} disabled={!chosen}>
            Save
          </button>
        </>
      }
    >
      <p className="text-lg text-stone-800">
        <span className="font-semibold tabular-nums">{money(cents(record.amount), store.settings.currencySymbol)}</span> on {longDate(record.date, today)}
      </p>
      <p className="mb-5 text-base text-stone-600">
        {record.card} · from {record.source === 'alert' ? 'a card alert email' : 'a statement'}
      </p>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-stone-700">Category</legend>
        <div className="flex flex-wrap gap-2">
          {choices.map((c) => (
            <Chip key={c} active={c === chosen} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
        <input
          className={`${inputClass} mt-3`}
          aria-label="Another category"
          placeholder="Another category"
          maxLength={60}
          value={choices.includes(category) ? '' : category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </fieldset>

      {phrase && (
        <div className="mt-4">
          <Checkbox checked={always} onChange={setAlways}>
            Always put “{phrase}” in {chosen || 'this category'}
          </Checkbox>
        </div>
      )}
    </Dialog>
  );
}
