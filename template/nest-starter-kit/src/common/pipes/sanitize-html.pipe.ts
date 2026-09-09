import { Injectable, Optional, type PipeTransform } from '@nestjs/common';
import sanitizeHtml, { type IOptions } from 'sanitize-html';

export type SanitizeHtmlOptions = IOptions;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function sanitizeValue<T>(value: T, options?: SanitizeHtmlOptions): T {
  if (typeof value === 'string') {
    return sanitizeHtml(value, options) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = sanitizeValue(val, options);
    }
    return result as T;
  }

  return value;
}

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(@Optional() private readonly options?: SanitizeHtmlOptions) {}

  transform<T>(value: T): T {
    return sanitizeValue(value, this.options);
  }
}
