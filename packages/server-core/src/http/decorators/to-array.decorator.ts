import { Transform } from 'class-transformer';

export function ToArray() {
  return Transform(({ value }) => {
    if (value === undefined) return undefined;
    return Array.isArray(value) ? value : [value];
  });
}
