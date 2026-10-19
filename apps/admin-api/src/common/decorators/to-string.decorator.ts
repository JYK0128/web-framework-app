import { Transform } from 'class-transformer';

function parseString(value: unknown): unknown {
  if (value === undefined || value === null) return value;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return `${value}`;
  return `${value as string}`;
}

export function ToString(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(parseString);
    return parseString(value);
  });
}
