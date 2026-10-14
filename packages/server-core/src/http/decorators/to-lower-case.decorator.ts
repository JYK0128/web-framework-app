import { Transform } from 'class-transformer';

export function ToLowerCase(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.toLowerCase() : value);
}
