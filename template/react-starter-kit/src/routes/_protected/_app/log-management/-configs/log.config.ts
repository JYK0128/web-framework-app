import { cva } from 'class-variance-authority';

import type { LogStatsResponseDto } from '#/.generated/api/model';

export const initialStats: LogStatsResponseDto = {
  totalRequests: 0,
  errorCount: 0,
  errorRate: 0,
  avgDuration: 0,
};

export const TIME_RANGE_OPTIONS = ['1h', '6h', '24h', '7d', '30d'] as const;
export type TimeRangeOption = (typeof TIME_RANGE_OPTIONS)[number];

export function getTimeRangeMs(range: TimeRangeOption): number {
  switch (range) {
    case '1h':
      return 1 * 60 * 60 * 1000;
    case '6h':
      return 6 * 60 * 60 * 1000;
    case '24h':
      return 24 * 60 * 60 * 1000;
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
  }
}

export const METHOD_OPTIONS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const STATUS_OPTIONS = ['ALL', '200', '201', '400', '401', '403', '404', '500'] as const;

export type LogMethodVariant = 'GET' | 'POST' | 'DELETE' | 'DEFAULT';

export const logMethodVariants = cva('font-mono font-bold', {
  variants: {
    method: {
      GET: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
      POST: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      DELETE: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      DEFAULT: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    },
  },
  defaultVariants: { method: 'DEFAULT' },
});

export function toLogMethodVariant(method: string): LogMethodVariant {
  return method === 'GET' || method === 'POST' || method === 'DELETE' ? method : 'DEFAULT';
}
