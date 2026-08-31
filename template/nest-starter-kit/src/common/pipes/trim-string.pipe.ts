import { Injectable, type PipeTransform } from '@nestjs/common';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function trimValue<T>(value: T): T {
  if (typeof value === 'string') {
    return value.trim() as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => trimValue(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = trimValue(val);
    }
    return result as T;
  }

  return value;
}

@Injectable()
export class TrimStringPipe implements PipeTransform {
  transform<T>(value: T): T {
    return trimValue(value);
  }
}
