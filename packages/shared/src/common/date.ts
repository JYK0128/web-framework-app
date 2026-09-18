export type DateLike = Date | string | number | null | undefined;
export type DateUnit = 'day' | 'month' | 'year';
export type TimeUnit = 'second' | 'minute' | 'hour';

export interface DateConfig {
  timezone: string
  locale: string
  formats: {
    date: string
    time: string
    dateTime: string
  }
}

export const INITIAL_CONFIG: DateConfig = {
  timezone: 'Asia/Seoul',
  locale: 'ko-KR',
  formats: {
    date: 'yyyy-MM-dd',
    time: 'HH:mm:ss',
    dateTime: 'yyyy-MM-dd HH:mm:ss',
  },
};

const config: DateConfig = {
  ...INITIAL_CONFIG,
  formats: { ...INITIAL_CONFIG.formats },
};

export const DEFAULT_TIMEZONE = INITIAL_CONFIG.timezone;

function patternToRegex(pattern: string): RegExp {
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/yyyy/g, '(?<year>\\d{4})')
    .replace(/yy/g, '(?<shortYear>\\d{2})')
    .replace(/MM/g, '(?<month>\\d{2})')
    .replace(/M/g, '(?<month>\\d{1,2})')
    .replace(/dd/g, '(?<day>\\d{2})')
    .replace(/d/g, '(?<day>\\d{1,2})')
    .replace(/HH/g, '(?<hour>\\d{2})')
    .replace(/H/g, '(?<hour>\\d{1,2})')
    .replace(/mm/g, '(?<minute>\\d{2})')
    .replace(/m/g, '(?<minute>\\d{1,2})')
    .replace(/ss/g, '(?<second>\\d{2})')
    .replace(/s/g, '(?<second>\\d{1,2})')
    .replace(/SSS/g, '(?<millisecond>\\d{3})');

  return new RegExp(`^${escaped}$`);
}

function parseByPattern(value: string, pattern: string): Date | null {
  const regex = patternToRegex(pattern);
  const match = regex.exec(value);
  if (!match?.groups) return null;

  const g = match.groups;
  let year = g.year ? Number(g.year) : undefined;
  if (year === undefined && g.shortYear) {
    const short = Number(g.shortYear);
    year = short >= 70 ? 1900 + short : 2000 + short;
  }
  if (year === undefined) return null;

  const month = Number(g.month ?? 1) - 1;
  const day = Number(g.day ?? 1);
  const hour = Number(g.hour ?? 0);
  const minute = Number(g.minute ?? 0);
  const second = Number(g.second ?? 0);
  const ms = Number(g.millisecond ?? 0);

  const date = new Date(year, month, day, hour, minute, second, ms);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDate(value: DateLike, pattern?: string): Date | null {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (pattern && typeof value === 'string') return parseByPattern(value, pattern);

  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(
  value: DateLike,
  pattern?: string,
  fallback = '-',
): string {
  const date = toDate(value);
  if (!date) return fallback;

  const targetPattern = pattern ?? config.formats.date;
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  return targetPattern
    .replace(/yyyy/g, String(year))
    .replace(/yy/g, String(year).slice(-2))
    .replace(/MM/g, String(month).padStart(2, '0'))
    .replace(/M/g, String(month))
    .replace(/dd/g, String(day).padStart(2, '0'))
    .replace(/d/g, String(day))
    .replace(/HH/g, String(hours).padStart(2, '0'))
    .replace(/H/g, String(hours))
    .replace(/mm/g, String(minutes).padStart(2, '0'))
    .replace(/m/g, String(minutes))
    .replace(/ss/g, String(seconds).padStart(2, '0'))
    .replace(/s/g, String(seconds))
    .replace(/SSS/g, String(milliseconds).padStart(3, '0'));
}

export function formatDateTime(
  value: DateLike,
  pattern?: string,
  fallback = '-',
): string {
  return formatDate(value, pattern ?? config.formats.dateTime, fallback);
}

export function isFuture(value: DateLike): boolean {
  const date = toDate(value);
  return date ? date.getTime() > Date.now() : false;
}

export function isPast(value: DateLike): boolean {
  const date = toDate(value);
  return date ? date.getTime() < Date.now() : false;
}

export function addDays(date: DateLike, n: number): Date | null {
  const d = toDate(date);
  if (!d) return null;
  const res = new Date(d.getTime());
  res.setDate(res.getDate() + n);
  return res;
}

export function addMinutes(date: DateLike, n: number): Date | null {
  const d = toDate(date);
  if (!d) return null;
  return new Date(d.getTime() + n * 60_000);
}

export function differenceInDays(dateLeft: DateLike, dateRight: DateLike): number {
  const l = toDate(dateLeft);
  const r = toDate(dateRight);
  if (!l || !r) return 0;
  return Math.trunc((l.getTime() - r.getTime()) / 86_400_000);
}

export function isAfter(date: DateLike, target: DateLike): boolean {
  const d = toDate(date);
  const t = toDate(target);
  return d && t ? d.getTime() > t.getTime() : false;
}

export function isBefore(date: DateLike, target: DateLike): boolean {
  const d = toDate(date);
  const t = toDate(target);
  return d && t ? d.getTime() < t.getTime() : false;
}

function getZonedParts(date: Date, timeZone: string): { year: number, month: number, day: number } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
  const parts = formatter.formatToParts(date);
  let year = 0;
  let month = 0;
  let day = 0;
  for (const p of parts) {
    if (p.type === 'year') year = Number(p.value);
    if (p.type === 'month') month = Number(p.value);
    if (p.type === 'day') day = Number(p.value);
  }
  return { year, month, day };
}

function getTimeZoneOffset(date: Date, timeZone: string): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
  return tzDate.getTime() - utcDate.getTime();
}

export function isToday(value: DateLike, timeZone?: string): boolean {
  const d = toDate(value);
  if (!d) return false;
  const tz = timeZone ?? config.timezone;
  const target = getZonedParts(d, tz);
  const now = getZonedParts(new Date(), tz);
  return (
    target.year === now.year
    && target.month === now.month
    && target.day === now.day
  );
}

export function isValid(value: unknown): boolean {
  return toDate(value as DateLike) !== null;
}

export function startOfDay(date: DateLike = new Date(), timeZone?: string): Date | null {
  const d = toDate(date);
  if (!d) return null;
  return calcStartOf(d, 'day', timeZone ?? config.timezone);
}

function calcDateAdd(d: Date, amount: number, unit: DateUnit): Date {
  const res = new Date(d.getTime());
  if (unit === 'day') {
    res.setDate(res.getDate() + amount);
  }
  else if (unit === 'month') {
    res.setMonth(res.getMonth() + amount);
  }
  else {
    res.setFullYear(res.getFullYear() + amount);
  }
  return res;
}

function calcTimeAdd(d: Date, amount: number, unit: TimeUnit): Date {
  if (unit === 'second') return new Date(d.getTime() + amount * 1_000);
  if (unit === 'minute') return new Date(d.getTime() + amount * 60_000);
  return new Date(d.getTime() + amount * 3_600_000);
}

function calcDateDiff(l: Date, r: Date, unit: DateUnit): number {
  if (unit === 'day') return Math.trunc((l.getTime() - r.getTime()) / 86_400_000);
  if (unit === 'month') return (l.getFullYear() - r.getFullYear()) * 12 + (l.getMonth() - r.getMonth());
  return l.getFullYear() - r.getFullYear();
}

function calcTimeDiff(l: Date, r: Date, unit: TimeUnit): number {
  if (unit === 'second') return Math.trunc((l.getTime() - r.getTime()) / 1_000);
  if (unit === 'minute') return Math.trunc((l.getTime() - r.getTime()) / 60_000);
  return Math.trunc((l.getTime() - r.getTime()) / 3_600_000);
}

function calcStartOf(d: Date, unit: DateUnit, timeZone: string): Date {
  const parts = getZonedParts(d, timeZone);
  const y = parts.year;
  const m = unit === 'year' ? 0 : parts.month - 1;
  const day = unit === 'day' ? parts.day : 1;

  const utcMidnight = Date.UTC(y, m, day, 0, 0, 0, 0);
  const offset = getTimeZoneOffset(new Date(utcMidnight), timeZone);
  return new Date(utcMidnight - offset);
}

function calcEndOf(d: Date, unit: DateUnit, timeZone: string): Date {
  const parts = getZonedParts(d, timeZone);
  let nextUtc: number;

  if (unit === 'day') {
    nextUtc = Date.UTC(parts.year, parts.month - 1, parts.day + 1, 0, 0, 0, 0);
  }
  else if (unit === 'month') {
    nextUtc = Date.UTC(parts.year, parts.month, 1, 0, 0, 0, 0);
  }
  else {
    nextUtc = Date.UTC(parts.year + 1, 0, 1, 0, 0, 0, 0);
  }

  const offset = getTimeZoneOffset(new Date(nextUtc), timeZone);
  return new Date(nextUtc - offset - 1);
}

export const DateUtil = {
  configure: (options: DeepPartial<DateConfig>): void => {
    if (options.timezone) config.timezone = options.timezone;
    if (options.locale) config.locale = options.locale;
    if (options.formats) {
      config.formats = { ...config.formats, ...options.formats };
    }
  },

  getConfig: (): Readonly<DateConfig> => ({
    ...config,
    formats: { ...config.formats },
  }),

  resetConfig: (): void => {
    config.timezone = INITIAL_CONFIG.timezone;
    config.locale = INITIAL_CONFIG.locale;
    config.formats = { ...INITIAL_CONFIG.formats };
  },

  date: {
    now: (): Date => new Date(),
    parse: (value: DateLike, pattern?: string): Date | null => toDate(value, pattern),
    isValid: (value: unknown): boolean => isValid(value),

    format: (value: DateLike, pattern?: string, fallback = '-'): string =>
      formatDate(value, pattern ?? config.formats.date, fallback),
    formatLocale: (
      value: DateLike,
      locale?: string,
      options?: Intl.DateTimeFormatOptions,
      fallback = '-',
    ): string => {
      const date = toDate(value);
      const opts = { timeZone: config.timezone, ...options };
      return date ? date.toLocaleDateString(locale ?? config.locale, opts) : fallback;
    },

    add: (date: DateLike, amount: number, unit: DateUnit = 'day'): Date | null => {
      const d = toDate(date);
      return d ? calcDateAdd(d, amount, unit) : null;
    },
    sub: (date: DateLike, amount: number, unit: DateUnit = 'day'): Date | null => {
      const d = toDate(date);
      return d ? calcDateAdd(d, -amount, unit) : null;
    },
    diff: (d1: DateLike, d2: DateLike, unit: DateUnit = 'day'): number => {
      const l = toDate(d1);
      const r = toDate(d2);
      return l && r ? calcDateDiff(l, r, unit) : 0;
    },

    startOf: (
      date: DateLike = new Date(),
      unit: DateUnit = 'day',
      timeZone?: string,
    ): Date | null => {
      const d = toDate(date);
      return d ? calcStartOf(d, unit, timeZone ?? config.timezone) : null;
    },
    endOf: (
      date: DateLike = new Date(),
      unit: DateUnit = 'day',
      timeZone?: string,
    ): Date | null => {
      const d = toDate(date);
      return d ? calcEndOf(d, unit, timeZone ?? config.timezone) : null;
    },

    isToday: (value: DateLike, timeZone?: string): boolean => isToday(value, timeZone ?? config.timezone),
    isFuture: (value: DateLike): boolean => isFuture(value),
    isPast: (value: DateLike): boolean => isPast(value),
    isAfter: (date: DateLike, target: DateLike): boolean => isAfter(date, target),
    isBefore: (date: DateLike, target: DateLike): boolean => isBefore(date, target),
  },

  time: {
    format: (value: DateLike, pattern?: string, fallback = '-'): string =>
      formatDate(value, pattern ?? config.formats.time, fallback),
    formatLocale: (
      value: DateLike,
      locale?: string,
      options?: Intl.DateTimeFormatOptions,
      fallback = '-',
    ): string => {
      const date = toDate(value);
      const opts = { timeZone: config.timezone, ...options };
      return date ? date.toLocaleTimeString(locale ?? config.locale, opts) : fallback;
    },

    add: (date: DateLike, amount: number, unit: TimeUnit = 'minute'): Date | null => {
      const d = toDate(date);
      return d ? calcTimeAdd(d, amount, unit) : null;
    },
    sub: (date: DateLike, amount: number, unit: TimeUnit = 'minute'): Date | null => {
      const d = toDate(date);
      return d ? calcTimeAdd(d, -amount, unit) : null;
    },
    diff: (d1: DateLike, d2: DateLike, unit: TimeUnit = 'minute'): number => {
      const l = toDate(d1);
      const r = toDate(d2);
      return l && r ? calcTimeDiff(l, r, unit) : 0;
    },
  },

  dateTime: {
    now: (): Date => new Date(),

    format: (value: DateLike, pattern?: string, fallback = '-'): string =>
      formatDateTime(value, pattern ?? config.formats.dateTime, fallback),
    formatLocale: (
      value: DateLike,
      locale?: string,
      options?: Intl.DateTimeFormatOptions,
      fallback = '-',
    ): string => {
      const date = toDate(value);
      const opts = { timeZone: config.timezone, ...options };
      return date ? date.toLocaleString(locale ?? config.locale, opts) : fallback;
    },
  },
} as const;
