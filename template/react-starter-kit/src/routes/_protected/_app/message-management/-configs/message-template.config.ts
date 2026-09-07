import { cva } from 'class-variance-authority';

export const messageChannelVariants = cva('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium border transition-colors', {
  variants: {
    channel: {
      EMAIL: 'border-blue-200 bg-blue-500/10 text-blue-600 dark:border-blue-900 dark:text-blue-400',
      SLACK: 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-900 dark:text-emerald-400',
      IN_APP: 'border-purple-200 bg-purple-500/10 text-purple-600 dark:border-purple-900 dark:text-purple-400',
      SMS: 'border-amber-200 bg-amber-500/10 text-amber-600 dark:border-amber-900 dark:text-amber-400',
      ALIMTALK: 'border-yellow-300 bg-yellow-500/10 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400',
    },
  },
});
