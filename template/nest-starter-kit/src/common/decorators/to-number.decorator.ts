import { Transform } from 'class-transformer';

export function ToNumber(): PropertyDecorator {
  return Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return value;
    return Number(value);
  });
}
