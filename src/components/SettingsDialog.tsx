import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { Chip, Dialog, ghostButton, iconButton, inputClass, overline, primaryButton, secondaryButton } from '@huishouden/pwa-kit/react/ui';
import { readError } from '@huishouden/pwa-kit/feedback';
import type { SpendingStore } from '../data/store';
import type { Card } from '../data/model';
import { readSheetTabs, sheetsToken } from '../data/sheetTabs';
import { auth } from '../services/auth';
import { CATEGORIES } from '../lib/categorise';
import { categoryChoices } from '../lib/month';
import { fromSheetTabs, pastedRows, type SheetSettings } from '../lib/sheetSettings';

export type SettingsTab = 'budget' | 'cards' | 'categories' | 'email';

const TABS: { id: SettingsTab; label: string }[] = [
  { id: 'budget', label: 'Budget' },
  { id: 'cards', label: 'Cards' },
  { id: 'categories', label: 'Categories' },
  { id: 'email', label: 'Email' },
];

const labelClass = 'mb-1.5 block text-sm font-medium text-stone-700';
const hintClass = 'mt-1 text-sm text-stone-600';

interface Props {
  store: SpendingStore;
  tab: SettingsTab;
  onTab: (tab: SettingsTab) => void;
  notify: (message: string) => void;
  onClose: () => void;
}

/** The household's settings, shared by every member. */
export function SettingsDialog({ store, tab, onTab, notify, onClose }: Props) {
  return (
    <Dialog title="Settings" onClose={onClose}>
      <div role="tablist" aria-label="Settings sections" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1">
        {TABS.map((t) => (
          <Chip key={t.id} active={tab === t.id} onClick={() => onTab(t.id)}>
            {t.label}
          </Chip>
        ))}
      </div>
      {!store.live && <p className="mb-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-600">These are the sample household’s settings. Changes last until the page reloads.</p>}
      {/* Each tab copies the settings into its form when it opens: before they arrive it would show
          the defaults, and saving would overwrite the household's own. */}
      {!store.ready ? (
        <p role="status" className="py-6 text-base text-stone-600">
          Loading the household’s settings
        </p>
      ) : (
        <>
          {tab === 'budget' && <BudgetTab store={store} notify={notify} />}
          {tab === 'cards' && <CardsTab store={store} />}
          {tab === 'categories' && <CategoriesTab store={store} />}
          {tab === 'email' && <EmailTab store={store} />}
        </>
      )}
    </Dialog>
  );
}

function WordList({ words, onChange, placeholder, label, lower = true }: { words: string[]; onChange: (w: string[]) => void; placeholder: string; label: string; lower?: boolean }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const w = (lower ? draft.toLowerCase() : draft).trim();
    if (w && !words.some((x) => x.toLowerCase() === w.toLowerCase())) onChange([...words, w]);
    setDraft('');
  };
  return (
    <div>
      <ul className="mb-2 flex flex-wrap gap-2" aria-label={label}>
        {words.map((w) => (
          <li key={w} className="inline-flex items-center gap-1 rounded-full border border-stone-200 bg-white py-1 pr-1 pl-3 text-sm">
            {w}
            <button type="button" className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-600 hover:bg-stone-100" aria-label={`Remove ${w}`} onClick={() => onChange(words.filter((x) => x !== w))}>
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className={inputClass}
          value={draft}
          placeholder={placeholder}
          aria-label={`Add to ${label.toLowerCase()}`}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
        />
        <button type="button" className={secondaryButton} onClick={add}>
          <Plus size={18} /> Add
        </button>
      </div>
    </div>
  );
}

function BudgetTab({ store, notify }: { store: SpendingStore; notify: (m: string) => void }) {
  const [budget, setBudget] = useState(store.settings.monthlyBudget ? String(store.settings.monthlyBudget) : '');
  const [currency, setCurrency] = useState(store.settings.currencySymbol);
  const [words, setWords] = useState(store.settings.ignoredKeywords);
  const [status, setStatus] = useState<{ kind: 'idle' | 'saving' | 'saved' } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const save = async () => {
    setStatus({ kind: 'saving' });
    try {
      await store.actions.saveSettings({ monthlyBudget: parseFloat(budget) || 0, currencySymbol: currency, ignoredKeywords: words });
      setStatus({ kind: 'saved' });
      notify('Saved the budget');
    } catch (e) {
      setStatus({ kind: 'error', message: readError(e, "Couldn't save the budget") });
    }
  };
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className={labelClass} htmlFor="budget">
            Monthly budget
          </label>
          <input id="budget" className={`${inputClass} tabular-nums`} type="number" min="0" step="10" value={budget} placeholder="No budget" onChange={(e) => setBudget(e.target.value)} />
          <p className={hintClass}>What the household means to spend on its cards each month. Leave it empty to compare with last month instead.</p>
        </div>
        <div>
          <label className={labelClass} htmlFor="currency">
            Currency symbol
          </label>
          <input id="currency" className={inputClass} maxLength={4} value={currency} onChange={(e) => setCurrency(e.target.value)} />
        </div>
      </div>
      <div>
        <p className={labelClass}>Never count</p>
        <p className={`${hintClass} mb-3`}>Charges whose description has one of these words don't count as spending: rent, the mortgage, paying off a card.</p>
        <WordList words={words} onChange={setWords} placeholder="hoa, escrow" label="Words never counted" />
      </div>
      <div className="flex items-center justify-end gap-3">
        <p role="status" className={`text-sm ${status.kind === 'error' ? 'text-red-700' : 'text-forest-700'}`}>
          {status.kind === 'saved' ? 'Saved' : status.kind === 'error' ? status.message : ''}
        </p>
        <button type="button" className={primaryButton} onClick={save} disabled={status.kind === 'saving'}>
          {status.kind === 'saving' ? 'Saving…' : 'Save budget'}
        </button>
      </div>
    </div>
  );
}

const splitWords = (s: string) =>
  s
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);

function CardForm({ card, onSave, onCancel }: { card?: Card; onSave: (c: Omit<Card, 'id'>) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(card?.name ?? '');
  const [last4, setLast4] = useState(card?.last4 ?? '');
  const [issuer, setIssuer] = useState(card?.issuer ?? '');
  const [words, setWords] = useState((card?.alertWords ?? []).join(', '));
  const valid = name.trim().length > 0 && (last4 === '' || /^\d{4}$/.test(last4));
  return (
    <form
      className="space-y-4 rounded-2xl border border-stone-200 p-4"
      aria-label={card ? `Edit ${card.name}` : 'New card'}
      onSubmit={async (e) => {
        e.preventDefault();
        if (valid) await onSave({ ...(card?.csv ? { csv: card.csv } : {}), name: name.trim(), last4: last4 || undefined, issuer: issuer.trim() || undefined, alertWords: splitWords(words) });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className={labelClass} htmlFor="card-name">
            Name
          </label>
          <input id="card-name" className={inputClass} value={name} maxLength={60} placeholder="Card One" onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="card-last4">
            Last 4 digits
          </label>
          <input id="card-last4" className={`${inputClass} tabular-nums`} inputMode="numeric" maxLength={4} value={last4} placeholder="1111" onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="card-issuer">
          Bank or issuer
        </label>
        <input id="card-issuer" className={inputClass} value={issuer} maxLength={40} placeholder="Example Bank" onChange={(e) => setIssuer(e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="card-words">
          Alert words
        </label>
        <input id="card-words" className={inputClass} value={words} placeholder="alerts@bank.example.com, purchase alert" onChange={(e) => setWords(e.target.value)} />
        <p className={hintClass}>The address this card's purchase alerts come from, or words only those emails contain. Separate with commas.</p>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={ghostButton} onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className={primaryButton} disabled={!valid}>
          Save card
        </button>
      </div>
    </form>
  );
}

function CardsTab({ store }: { store: SpendingStore }) {
  const [editing, setEditing] = useState<string | 'new' | null>(store.cards.length === 0 ? 'new' : null);
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        The household's cards. Statement files and card alert emails are matched to a card by its last 4 digits, so every member's imports name a card the same way.
      </p>
      <ul className="divide-y divide-stone-200" aria-label="Cards">
        {store.cards.map((c) =>
          editing === c.id ? (
            <li key={c.id} className="py-3">
              <CardForm
                card={c}
                onCancel={() => setEditing(null)}
                onSave={async (next) => {
                  await store.actions.saveCard(c.id, next);
                  setEditing(null);
                }}
              />
            </li>
          ) : (
            <li key={c.id} aria-label={c.name} className="flex min-h-14 flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {c.name}
                  {c.last4 && <span className="ml-2 text-stone-600 tabular-nums">•••• {c.last4}</span>}
                </p>
                <p className="text-sm text-stone-600">
                  {[c.issuer, c.alertWords.length ? `Alerts: ${c.alertWords.join(', ')}` : 'No alert words yet', c.csv ? 'Statement columns remembered' : ''].filter(Boolean).join(' · ')}
                </p>
              </div>
              {confirm === c.id ? (
                <span className="flex items-center gap-2 text-sm">
                  Remove {c.name}? Its transactions stay.
                  <button type="button" className={secondaryButton} onClick={() => (void store.actions.deleteCard(c.id), setConfirm(null))}>
                    Remove
                  </button>
                  <button type="button" className={ghostButton} onClick={() => setConfirm(null)}>
                    Keep
                  </button>
                </span>
              ) : (
                <>
                  <button type="button" className={iconButton} aria-label={`Edit ${c.name}`} onClick={() => setEditing(c.id)}>
                    <Pencil size={18} />
                  </button>
                  <button type="button" className={iconButton} aria-label={`Remove ${c.name}`} onClick={() => setConfirm(c.id)}>
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? (
        <CardForm
          onCancel={() => setEditing(null)}
          onSave={async (c) => {
            await store.actions.saveCard(null, c);
            setEditing(null);
          }}
        />
      ) : (
        <button type="button" className={secondaryButton} onClick={() => setEditing('new')}>
          <Plus size={18} /> Add a card
        </button>
      )}
    </div>
  );
}

function CategoriesTab({ store }: { store: SpendingStore }) {
  const [filter, setFilter] = useState('');
  const [contains, setContains] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const choices = useMemo(() => categoryChoices(store.rules), [store.rules]);
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return [...store.rules]
      .filter((r) => !q || r.contains.toLowerCase().includes(q) || r.category.toLowerCase().includes(q))
      .sort((a, b) => a.category.localeCompare(b.category) || a.contains.localeCompare(b.contains));
  }, [store.rules, filter]);
  const add = async () => {
    if (!contains.trim() || !category.trim()) return;
    await store.actions.saveRule({ contains: contains.trim().toLowerCase(), category: category.trim() });
    setContains('');
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">
        New charges get the category of the longest phrase their description contains. Your own phrases win over the starting ones when they are more specific.
      </p>
      <form
        className="grid gap-3 rounded-2xl border border-stone-200 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        aria-label="New rule"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <div>
          <label className={labelClass} htmlFor="rule-contains">
            When the shop's name contains
          </label>
          <input id="rule-contains" className={inputClass} value={contains} maxLength={80} placeholder="example cafe" onChange={(e) => setContains(e.target.value)} />
        </div>
        <div>
          <label className={labelClass} htmlFor="rule-category">
            Category
          </label>
          <input id="rule-category" className={inputClass} list="category-choices" value={category} maxLength={60} onChange={(e) => setCategory(e.target.value)} />
          <datalist id="category-choices">
            {choices.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <button type="submit" className={primaryButton} disabled={!contains.trim() || !category.trim()}>
          Add rule
        </button>
      </form>
      <input className={inputClass} value={filter} placeholder="Find a rule" aria-label="Find a rule" onChange={(e) => setFilter(e.target.value)} />
      <ul className="divide-y divide-stone-200" aria-label="Category rules">
        {shown.map((r) => (
          <li key={r.id} aria-label={r.contains} className="flex min-h-11 items-center gap-3 py-1">
            <span className="min-w-0 flex-1 truncate">{r.contains}</span>
            <span className="text-sm text-stone-600">{r.category}</span>
            <button type="button" className={iconButton} aria-label={`Remove rule ${r.contains}`} onClick={() => void store.actions.deleteRule(r.id)}>
              <Trash2 size={18} />
            </button>
          </li>
        ))}
        {shown.length === 0 && <li className="py-3 text-sm text-stone-600">No rules match.</li>}
      </ul>
    </div>
  );
}

function EmailTab({ store }: { store: SpendingStore }) {
  const [link, setLink] = useState('');
  const [paste, setPaste] = useState({ cards: '', categories: '', labels: '' });
  const [found, setFound] = useState<SheetSettings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const read = async () => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      setFound(fromSheetTabs(await readSheetTabs(await sheetsToken(auth), link)));
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(code === 'auth/popup-closed-by-user' ? 'Google access was not given.' : readError(e, "Couldn't read the Sheet"));
    } finally {
      setBusy(false);
    }
  };
  const fromPaste = () => setFound(fromSheetTabs({ cards: pastedRows(paste.cards), categories: pastedRows(paste.categories), labels: pastedRows(paste.labels) }));
  const bringIn = async () => {
    if (!found) return;
    const r = await store.actions.importSheetSettings(found);
    setDone(`Added ${r.cards} card${r.cards === 1 ? '' : 's'}, ${r.rules} category rule${r.rules === 1 ? '' : 's'} and ${r.labels} label${r.labels === 1 ? '' : 's'}.`);
    setFound(null);
  };

  return (
    <div className="space-y-6">
      <section className="space-y-3" aria-label="Card alert emails">
        <h3 className={overline}>Card alert emails</h3>
        <p className="text-sm text-stone-600">
          Check email reads purchase alerts in the member's own Gmail, using each card's alert words and these Gmail labels. Google will warn that the app is unverified the first time. Spending only reads card alert emails and never changes your mail.
        </p>
        <WordList words={store.settings.alertLabels} lower={false} onChange={(w) => void store.actions.saveSettings({ alertLabels: w })} placeholder="Bank/Card alerts" label="Gmail labels" />
      </section>

      <details className="rounded-2xl border border-stone-200 px-4 py-2">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium text-stone-800">Bring settings from a Google Sheet</summary>
        <div className="space-y-3 pb-3">
        <p className="text-sm text-stone-600">
          For households that used the Sheet and its script: brings the Cards, Categories and Alert labels tabs in once. The Sheet is only read.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input className={inputClass} value={link} placeholder="https://docs.google.com/spreadsheets/d/..." aria-label="Sheet link" onChange={(e) => setLink(e.target.value)} />
          <button type="button" className={secondaryButton} onClick={read} disabled={busy || !link.trim() || !store.live}>
            {busy ? 'Reading' : 'Read the Sheet'}
          </button>
        </div>
        <details className="rounded-xl border border-stone-200 px-4 py-3">
          <summary className="min-h-8 cursor-pointer font-medium">Or paste the tabs' rows</summary>
          <div className="mt-3 space-y-3">
            {(
              [
                ['cards', 'Cards tab (Last4, Card, Alert source, Alert keywords)'],
                ['categories', 'Categories tab (Merchant contains, Category)'],
                ['labels', 'Alert labels tab'],
              ] as const
            ).map(([k, label]) => (
              <div key={k}>
                <label className={labelClass} htmlFor={`paste-${k}`}>
                  {label}
                </label>
                <textarea id={`paste-${k}`} className={`${inputClass} min-h-20 font-mono text-sm`} value={paste[k]} onChange={(e) => setPaste({ ...paste, [k]: e.target.value })} />
              </div>
            ))}
            <button type="button" className={secondaryButton} onClick={fromPaste} disabled={!paste.cards.trim() && !paste.categories.trim() && !paste.labels.trim()}>
              Read the rows
            </button>
          </div>
        </details>
        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-red-700">
            {error}
          </p>
        )}
        {found && (
          <div role="region" className="space-y-3 rounded-2xl border border-stone-200 p-4" aria-label="Found in the Sheet">
            <p>
              Found {found.cards.length} card{found.cards.length === 1 ? '' : 's'} ({found.cards.map((c) => c.name).join(', ') || 'none'}), {found.rules.length} category rule
              {found.rules.length === 1 ? '' : 's'} and {found.labels.length} label{found.labels.length === 1 ? '' : 's'}.
            </p>
            <div className="flex justify-end gap-3">
              <button type="button" className={ghostButton} onClick={() => setFound(null)}>
                Cancel
              </button>
              <button type="button" className={primaryButton} onClick={bringIn}>
                Bring them in
              </button>
            </div>
          </div>
        )}
        {done && (
          <p className="text-sm text-forest-600" aria-live="polite">
            {done} Add each card's alert address under Cards so Check email finds its alerts.
          </p>
        )}
      </div>
      </details>
    </div>
  );
}
