import { Transform } from 'class-transformer';

function parseUpperCase(value: unknown): unknown {
  return typeof value === 'string' ? value.toUpperCase() : value;
}

export function ToUpperCase(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(parseUpperCase);
    return parseUpperCase(value);
  });
}
