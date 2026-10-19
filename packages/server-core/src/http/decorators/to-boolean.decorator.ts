import { Transform } from 'class-transformer';

function parseBoolean(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
}

export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(parseBoolean);
    return parseBoolean(value);
  });
}
