import { cardClass } from '@huishouden/pwa-kit/react/ui';
import { money, type CategoryTotal, type MonthSummary } from '../lib/month';

interface Props {
  summary: MonthSummary;
  symbol: string;
  selected: string | null;
  onSelect: (category: CategoryTotal) => void;
}

/** The month's categories, largest first; tapping one shows its purchases. */
export function WhereItWent({ summary, symbol, selected, onSelect }: Props) {
  return (
    <section aria-labelledby="where-heading" className={`${cardClass} flex min-h-0 min-w-0 flex-col p-5 sm:p-6`}>
      <h2 id="where-heading" className="mb-2 flex min-h-11 items-center text-xl font-semibold text-stone-800">
        Where it went
      </h2>
      {summary.categories.length === 0 ? (
        <p className="py-2 text-base text-stone-600">Nothing spent in {summary.name} yet.</p>
      ) : (
        <ul className="-mx-2 min-h-0 flex-1 overflow-y-auto" aria-label={`Categories in ${summary.name}`}>
          {summary.categories.map((c) => {
            const active = c.name === selected;
            return (
              <li key={c.name}>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={`${c.name}, ${money(c.cents, symbol)}`}
                  onClick={() => onSelect(c)}
                  className={`block w-full rounded-xl px-2 py-2 text-left transition-colors duration-150 ${active ? 'bg-forest-50' : 'hover:bg-stone-100'}`}
                >
                  <span className="flex items-baseline gap-3">
                    <span className={`min-w-0 flex-1 truncate text-base ${active ? 'font-semibold text-forest-700' : 'font-medium text-stone-800'}`}>{c.name}</span>
                    <span className="text-base font-medium text-stone-800 tabular-nums">{money(c.cents, symbol, true)}</span>
                  </span>
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <span className="block h-full rounded-full bg-forest-600" style={{ width: `${c.share * 100}%` }} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
