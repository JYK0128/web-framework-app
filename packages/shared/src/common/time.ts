export const TimeUtil = {
  MS_PER_SECOND: 1_000,
  MS_PER_MINUTE: 60_000,
  MS_PER_HOUR: 3_600_000,
  MS_PER_DAY: 86_400_000,

  S_PER_MINUTE: 60,
  S_PER_HOUR: 3_600,
  S_PER_DAY: 86_400,

  ms: {
    second: (n = 1): number => n * 1_000,
    minute: (n = 1): number => n * 60 * 1_000,
    hour: (n = 1): number => n * 60 * 60 * 1_000,
    day: (n = 1): number => n * 24 * 60 * 60 * 1_000,
  },

  s: {
    second: (n = 1): number => n,
    minute: (n = 1): number => n * 60,
    hour: (n = 1): number => n * 3_600,
    day: (n = 1): number => n * 86_400,
  },
} as const;
