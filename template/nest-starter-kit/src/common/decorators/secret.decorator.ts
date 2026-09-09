import 'reflect-metadata';

export const SECRET_METADATA_KEY = Symbol('IS_SECRET_PROPERTY');

/**
 * Property decorator that marks a DTO field as containing sensitive secret information
 * (passwords, tokens, secret keys).
 * When processed by maskSecrets, these fields are cleared to an empty string ("")
 * so they are never exposed in browser developer tools or API responses.
 */
export function Secret(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing = (Reflect.getMetadata(SECRET_METADATA_KEY, target.constructor) as Array<string | symbol> | undefined) ?? [];
    if (!existing.includes(propertyKey)) {
      Reflect.defineMetadata(SECRET_METADATA_KEY, [...existing, propertyKey], target.constructor);
    }
  };
}

function clearSecretKeys(copy: Record<string, unknown>, secretProps: Array<string | symbol>): void {
  if (secretProps.length > 0) {
    for (const prop of secretProps) {
      if (typeof prop === 'string' && prop in copy && copy[prop]) {
        copy[prop] = '';
      }
    }
    return;
  }

  const commonSecretKeys = ['clientSecret', 'client_secret', 'secretKey', 'secret_key', 'apiSecret', 'api_secret'];
  for (const key of commonSecretKeys) {
    if (key in copy && copy[key]) {
      copy[key] = '';
    }
  }
}

/**
 * Recursively inspects an object/instance and masks any fields decorated with @Secret()
 * by replacing their value with an empty string ("").
 */
export function maskSecrets<T>(target: T): T {
  if (!target || typeof target !== 'object') {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item) => maskSecrets(item)) as unknown as T;
  }

  const constructor = (target as unknown as { constructor?: new (...args: unknown[]) => unknown }).constructor;
  const secretProps = constructor
    ? ((Reflect.getMetadata(SECRET_METADATA_KEY, constructor) as Array<string | symbol> | undefined) ?? [])
    : [];

  const copy = { ...target } as Record<string, unknown>;
  clearSecretKeys(copy, secretProps);

  // Recurse into nested objects
  for (const [key, val] of Object.entries(copy)) {
    if (val !== null && val !== undefined && typeof val === 'object') {
      copy[key] = maskSecrets(val);
    }
  }

  return copy as T;
}
