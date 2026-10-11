import { type ArgumentMetadata, Injectable, Optional, type PipeTransform } from '@nestjs/common';
import { sanitizeEditorHtml } from '@pkg/shared/editor';
import sanitizeHtml, { type IOptions } from 'sanitize-html';

export type SanitizeHtmlOptions = IOptions;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function sanitizeValue<T>(value: T, options?: SanitizeHtmlOptions, richTextFields: readonly string[] = []): T {
  if (typeof value === 'string') {
    return sanitizeHtml(value, options) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = richTextFields.includes(key) && typeof val === 'string'
        ? sanitizeEditorHtml(val)
        : sanitizeValue(val, options);
    }
    return result as T;
  }

  return value;
}

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(@Optional() private readonly options?: SanitizeHtmlOptions) {}

  transform<T>(value: T, metadata: ArgumentMetadata): T {
    const metatype = metadata.metatype as (ArgumentMetadata['metatype'] & { richTextFields?: readonly string[] });
    const fields = metadata.type === 'body' ? metatype?.richTextFields ?? [] : [];
    return sanitizeValue(value, this.options, fields);
  }
}
