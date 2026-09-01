import { Transform } from 'class-transformer';

export function ToDate(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') return new Date(value);
    return value;
  });
}
