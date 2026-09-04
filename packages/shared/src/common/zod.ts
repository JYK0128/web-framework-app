import { z } from 'zod';

export type ZodTranslator = (key: string, options?: unknown) => string;

let translator: ZodTranslator | null = null;

export function setZodTranslator(fn: ZodTranslator): void {
  translator = fn;
}

z.config({
  customError: (issue) => {
    if (!translator) return undefined;

    // 1. Required / Not Empty / Type Mismatch
    if (issue.code === 'invalid_type') {
      if (issue.input === undefined || issue.input === null) {
        return translator('validation.isNotEmpty');
      }
      return translator('validation.isString');
    }

    // 2. String Min / Max
    if (issue.code === 'too_small') {
      if (issue.origin === 'string') {
        if (Number(issue.minimum) === 1) {
          return translator('validation.isNotEmpty');
        }
        return translator('validation.minLength', { constraints: [Number(issue.minimum)] });
      }
    }

    if (issue.code === 'too_big') {
      if (issue.origin === 'string') {
        return translator('validation.maxLength', { constraints: [Number(issue.maximum)] });
      }
    }

    // 3. Email Format
    if (issue.code === 'invalid_format' && issue.format === 'email') {
      return translator('validation.isEmail');
    }

    return undefined;
  },
});

export { z };
