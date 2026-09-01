import { cva } from 'class-variance-authority';

import type { ActivityStatsResponseDto } from '#/.generated/api/model';

export const initialStats: ActivityStatsResponseDto = {
  totalRequests: 0,
  errorCount: 0,
  errorRate: 0,
  avgDuration: 0,
  last24hCount: 0,
};

export const METHOD_OPTIONS = ['ALL', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const STATUS_OPTIONS = ['ALL', '200', '201', '400', '401', '403', '404', '500'] as const;

export type ActivityLogMethodVariant = 'GET' | 'POST' | 'DELETE' | 'DEFAULT';

export const activityLogMethodVariants = cva('font-mono font-bold', {
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

export function toActivityLogMethodVariant(method: string): ActivityLogMethodVariant {
  return method === 'GET' || method === 'POST' || method === 'DELETE' ? method : 'DEFAULT';
}
