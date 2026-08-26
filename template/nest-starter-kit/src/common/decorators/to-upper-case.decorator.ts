import { Transform } from 'class-transformer';

export function ToUpperCase(): PropertyDecorator {
  return Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase() : value));
}
