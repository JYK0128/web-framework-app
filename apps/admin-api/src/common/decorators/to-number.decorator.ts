import { Transform } from 'class-transformer';

function parseNumber(value: unknown): unknown {
  if (value === undefined || value === null || value === '') return value;
  return Number(value);
}

export function ToNumber(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(parseNumber);
    return parseNumber(value);
  });
}
