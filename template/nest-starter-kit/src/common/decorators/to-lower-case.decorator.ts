import { Transform } from 'class-transformer';

function parseLowerCase(value: unknown): unknown {
  return typeof value === 'string' ? value.toLowerCase() : value;
}

export function ToLowerCase(): PropertyDecorator {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value.map(parseLowerCase);
    return parseLowerCase(value);
  });
}
