import { cva } from 'class-variance-authority';

export const messageChannelVariants = cva('gap-1 text-xs', {
  variants: {
    channel: {
      EMAIL: 'border-blue-200 bg-blue-500/10 text-blue-600 dark:border-blue-900 dark:text-blue-400',
      SLACK: 'border-emerald-200 bg-emerald-500/10 text-emerald-600 dark:border-emerald-900 dark:text-emerald-400',
      IN_APP: 'border-purple-200 bg-purple-500/10 text-purple-600 dark:border-purple-900 dark:text-purple-400',
      SMS: 'border-purple-200 bg-purple-500/10 text-purple-600 dark:border-purple-900 dark:text-purple-400',
      ALIMTALK: 'border-purple-200 bg-purple-500/10 text-purple-600 dark:border-purple-900 dark:text-purple-400',
    },
  },
});
