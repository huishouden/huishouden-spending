import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

// Shapes from DESIGN.md "Components" (as the Tasks and Bills apps' ui.tsx), with the forest dark theme.

export const inputClass =
  'w-full min-h-11 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-base text-stone-800 outline-none focus:border-forest-500 focus:ring-2 focus:ring-forest-200 dark:border-forest-600 dark:bg-forest-900 dark:text-stone-100';

export const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest-700 px-4 py-2.5 font-medium text-white transition-colors duration-150 hover:bg-forest-600 disabled:opacity-50 dark:bg-forest-400 dark:text-forest-900 dark:hover:bg-forest-300';

export const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 font-medium text-stone-800 transition-colors duration-150 hover:bg-stone-100 disabled:opacity-50 dark:border-forest-600 dark:bg-forest-800 dark:text-stone-100 dark:hover:bg-forest-700';

export const ghostButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 font-medium text-stone-600 transition-colors duration-150 hover:bg-stone-100 disabled:opacity-50 dark:text-stone-300 dark:hover:bg-forest-700';

export const iconButton =
  'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-stone-600 transition-colors duration-150 hover:bg-stone-100 disabled:opacity-30 dark:text-stone-300 dark:hover:bg-forest-700';

export const labelClass = 'mb-1.5 block text-sm font-medium text-stone-800 dark:text-stone-100';
export const hintClass = 'mt-1 text-sm text-stone-600 dark:text-stone-300';
export const overline = 'text-xs font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-300';

export function Chip({ active, onClick, children, label }: { active?: boolean; onClick: () => void; children: ReactNode; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
        active
          ? 'border-forest-700 bg-forest-700 text-white dark:border-forest-400 dark:bg-forest-400 dark:text-forest-900'
          : 'border-stone-200 bg-white text-stone-700 hover:border-forest-400 dark:border-forest-600 dark:bg-forest-800 dark:text-stone-100'
      }`}
    >
      {children}
    </button>
  );
}

/** White rounded dialog over a scrim; a bottom sheet on phones. Escape and the X close it. */
export function Dialog({
  title,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close.current();
    window.addEventListener('keydown', onKey);
    panel.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white text-stone-800 shadow-2xl outline-none sm:rounded-3xl dark:bg-forest-800 dark:text-stone-100 ${
          wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-6 py-4 dark:border-forest-600">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className={iconButton} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-3 border-t border-stone-200 px-6 py-4 dark:border-forest-600">{footer}</div>}
      </div>
    </div>
  );
}

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-red-700/30 px-4 py-3 text-sm text-red-700 dark:text-red-300">
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button type="button" className={ghostButton} onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
