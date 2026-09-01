import { cva } from 'class-variance-authority';
import type { IconName } from 'lucide-react/dynamic';

export type OperatingStatus = 'OPEN' | 'LUNCH_BREAK' | 'MAINTENANCE' | 'HOLIDAY' | 'WEEKEND' | 'CLOSED';

export const OPERATING_STATUS_ICONS: Record<OperatingStatus, IconName> = {
  OPEN: 'check-circle-2',
  LUNCH_BREAK: 'coffee',
  MAINTENANCE: 'wrench',
  HOLIDAY: 'clock',
  WEEKEND: 'clock',
  CLOSED: 'clock',
};

export const operatingStatusIconVariants = cva('flex size-10 shrink-0 items-center justify-center rounded-lg', {
  variants: {
    status: {
      OPEN: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      LUNCH_BREAK: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      MAINTENANCE: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
      HOLIDAY: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
      WEEKEND: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
      CLOSED: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
    },
  },
  defaultVariants: { status: 'CLOSED' },
});

export const operatingStatusBadgeVariants: Record<OperatingStatus, 'default' | 'secondary' | 'destructive'> = {
  OPEN: 'default',
  LUNCH_BREAK: 'secondary',
  MAINTENANCE: 'destructive',
  HOLIDAY: 'secondary',
  WEEKEND: 'secondary',
  CLOSED: 'secondary',
};

export function toOperatingStatus(code: string): OperatingStatus {
  return code === 'OPEN' || code === 'LUNCH_BREAK' || code === 'MAINTENANCE' || code === 'HOLIDAY' || code === 'WEEKEND'
    ? code
    : 'CLOSED';
}

export function getOperatingStatusMessage(message: unknown, language: string, fallback: string): string {
  if (typeof message === 'string' && message.trim()) return message;
  if (!message || typeof message !== 'object') return fallback;

  const translations = message as Record<string, unknown>;
  const languageKey = language.split('-')[0];
  const localizedMessage = translations[language]
    ?? translations[languageKey]
    ?? translations.ko
    ?? Object.values(translations).find((value) => typeof value === 'string');

  return typeof localizedMessage === 'string' && localizedMessage.trim() ? localizedMessage : fallback;
}
