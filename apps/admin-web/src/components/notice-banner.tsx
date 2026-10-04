import { X } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Button } from '#/.generated/shadcn/components/ui';

const toneClasses = {
  info: 'border-sky-300/60 bg-sky-50 text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100',
  warning: 'border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100',
  success: 'border-emerald-300/60 bg-emerald-50 text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-100',
  danger: 'border-destructive/40 bg-destructive/5 text-destructive',
} as const;

export type NoticeBannerTone = keyof typeof toneClasses;

type NoticeBannerProps = {
  tone?: NoticeBannerTone
  title?: string
  children: ReactNode
  dismissible?: boolean
  closeLabel?: string
};

/** Inline notice for page-level service information. Dismissal lasts until this instance unmounts. */
export function NoticeBanner({ tone = 'info', title, children, dismissible = false, closeLabel = '안내 닫기' }: NoticeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      role={tone === 'danger' ? 'alert' : 'status'}
      className={`
        flex items-start justify-between gap-3 rounded-lg border px-4 py-3
        text-sm
        ${toneClasses[tone]}
      `}
    >
      <div className="flex items-start gap-3">
        {title && <span className="shrink-0 font-semibold">{title}</span>}
        <div>{children}</div>
      </div>
      {dismissible && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={closeLabel}
          onClick={() => setDismissed(true)}
        >
          <X />
        </Button>
      )}
    </aside>
  );
}
