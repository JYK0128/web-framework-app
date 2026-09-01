import { Transform } from 'class-transformer';

export function ToString(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return String(value);
  });
}
