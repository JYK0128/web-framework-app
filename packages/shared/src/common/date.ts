import { addDays, addMinutes, differenceInDays, format as fnsFormat, isAfter, isBefore, isToday, isValid, startOfDay } from 'date-fns';

export type DateLike = Date | string | number | null | undefined;

/**
 * Converts a DateLike value into a valid Date object or null.
 */
export function toDate(value: DateLike): Date | null {
  if (value === null || value === undefined || value === '') return null;
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  return isValid(date) ? date : null;
}

/**
 * Null-safe date formatter (returns fallback if value is null/undefined/invalid).
 */
export function formatDate(
  value: DateLike,
  pattern = 'yyyy-MM-dd',
  fallback = '-',
): string {
  const date = toDate(value);
  return date ? fnsFormat(date, pattern) : fallback;
}

/**
 * Null-safe date-time formatter (returns fallback if value is null/undefined/invalid).
 */
export function formatDateTime(
  value: DateLike,
  pattern = 'yyyy-MM-dd HH:mm:ss',
  fallback = '-',
): string {
  return formatDate(value, pattern, fallback);
}

/**
 * Checks if the given date is in the future compared to now.
 * Returns false if the value is null/undefined.
 */
export function isFuture(value: DateLike): boolean {
  const date = toDate(value);
  return date ? isAfter(date, new Date()) : false;
}

/**
 * Checks if the given date is in the past compared to now.
 * Returns false if the value is null/undefined.
 */
export function isPast(value: DateLike): boolean {
  const date = toDate(value);
  return date ? isBefore(date, new Date()) : false;
}

export { addDays, addMinutes, differenceInDays, isAfter, isBefore, isToday, isValid, startOfDay };
