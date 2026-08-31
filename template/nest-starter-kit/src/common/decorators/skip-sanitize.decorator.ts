import { SetMetadata } from '@nestjs/common';

export const SKIP_SANITIZE_KEY = 'skip_sanitize';

/**
 * Decorator to skip HTML sanitization on a controller method, controller class, DTO class, or DTO property.
 */
export function SkipSanitize(): PropertyDecorator & MethodDecorator & ClassDecorator {
  return ((
    target: object,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ): void => {
    if (propertyKey !== undefined) {
      if (descriptor) {
        SetMetadata(SKIP_SANITIZE_KEY, true)(target, propertyKey, descriptor);
      }
      else {
        Reflect.defineMetadata(SKIP_SANITIZE_KEY, true, target, propertyKey);
      }
    }
    else if (typeof target === 'function') {
      SetMetadata(SKIP_SANITIZE_KEY, true)(target);
    }
    else {
      Reflect.defineMetadata(SKIP_SANITIZE_KEY, true, target);
    }
  }) as PropertyDecorator & MethodDecorator & ClassDecorator;
}
