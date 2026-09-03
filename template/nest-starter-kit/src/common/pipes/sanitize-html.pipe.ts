import { type ArgumentMetadata, Injectable, Optional, type PipeTransform } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import sanitizeHtml, { type IOptions } from 'sanitize-html';
import { when } from '@pkg/shared/common';

import { SKIP_SANITIZE_KEY } from '#/common/decorators/skip-sanitize.decorator';

export type SanitizeHtmlOptions = IOptions;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

function sanitizeValue<T>(
  value: T,
  metatype?: unknown,
  options?: SanitizeHtmlOptions,
): T {
  if (typeof value === 'string') {
    return sanitizeHtml(value, options) as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, metatype, options)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    const proto = when((value): value is { prototype: object } => typeof value === 'function', (type) => type.prototype)(metatype);

    for (const [key, val] of Object.entries(value)) {
      const isFieldSkipped = proto ? Reflect.getMetadata(SKIP_SANITIZE_KEY, proto, key) === true : false;
      result[key] = isFieldSkipped ? val : sanitizeValue(val, undefined, options);
    }
    return result as T;
  }

  return value;
}

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(
    @Optional() private readonly cls?: ClsService,
    @Optional() private readonly options?: SanitizeHtmlOptions,
  ) {}

  transform<T>(value: T, metadata?: ArgumentMetadata): T {
    if (this.cls?.get<boolean>('skipSanitize') === true) {
      return value;
    }

    if (metadata?.metatype && Reflect.getMetadata(SKIP_SANITIZE_KEY, metadata.metatype) === true) {
      return value;
    }

    return sanitizeValue(value, metadata?.metatype, this.options);
  }
}
