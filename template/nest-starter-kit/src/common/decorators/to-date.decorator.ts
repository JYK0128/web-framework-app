import { Transform } from 'class-transformer';

function parseDate(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  return value;
}

export function ToDate(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(parseDate);
    return parseDate(value);
  });
}
