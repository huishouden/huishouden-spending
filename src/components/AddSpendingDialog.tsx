import type { ReactNode } from 'react';
import { ChevronRight, FileUp, Mail } from 'lucide-react';
import { Dialog } from '@huishouden/pwa-kit/react/ui';
import type { SpendingStore } from '../data/store';

interface Props {
  store: SpendingStore;
  checking: boolean;
  onCheckEmail: () => void;
  onImport: () => void;
  /** Settings > Cards, when no card says what its alert emails look like yet. */
  onCards: () => void;
  onClose: () => void;
}

/** The two ways spending comes in: card alert emails, and statement files. */
export function AddSpendingDialog({ store, checking, onCheckEmail, onImport, onCards, onClose }: Props) {
  const canSearch = store.cards.some((c) => c.alertWords.length > 0) || store.settings.alertLabels.length > 0;
  const firstTime = store.live && canSearch && !store.mail.stored();
  return (
    <Dialog title="Add spending" onClose={onClose}>
      <div className="space-y-3">
        {canSearch ? (
          <Choice icon={<Mail size={22} />} title="Check email" text="Reads your card alert emails for new purchases." onClick={onCheckEmail} disabled={checking} />
        ) : (
          <Choice
            icon={<Mail size={22} />}
            title="Set up card alert emails"
            text={store.cards.length ? 'Add the address each card’s alerts come from.' : 'Add your cards and the address their alerts come from.'}
            onClick={onCards}
          />
        )}
        <Choice icon={<FileUp size={22} />} title="Import a statement" text="A CSV file from your bank’s or card’s website." onClick={onImport} />
      </div>
      {firstTime && (
        <p className="mt-4 text-sm text-stone-600">Google warns that the app is unverified the first time. Spending only reads card alert emails and never changes your mail.</p>
      )}
    </Dialog>
  );
}

function Choice({ icon, title, text, onClick, disabled }: { icon: ReactNode; title: string; text: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-16 w-full items-center gap-4 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left transition-colors duration-150 hover:border-forest-400 hover:bg-stone-100 disabled:opacity-50"
    >
      <span className="text-forest-700">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-stone-800">{title}</span>
        <span className="block text-sm text-stone-600">{text}</span>
      </span>
      <ChevronRight size={20} className="text-stone-600" />
    </button>
  );
}
