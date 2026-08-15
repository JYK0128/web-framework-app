export const ENUM_NAME_SYMBOL = Symbol('enumName');

export type DefinedEnum<T extends Record<string, string | number>> = T & {
  readonly [ENUM_NAME_SYMBOL]?: string
};

/**
 * Creates an enum-like object with hidden enumName metadata for Swagger and OpenAPI code generators.
 * The returned object behaves identically to a standard `as const` object.
 *
 * @example
 * export const RoleName = defineEnum('RoleName', {
 *   USER: 'user',
 *   ADMIN: 'admin',
 * } as const);
 * export type RoleName = (typeof RoleName)[keyof typeof RoleName];
 */
export function defineEnum<
  TName extends string,
  TObj extends Record<string, string | number>,
>(name: TName, values: TObj): TObj {
  return Object.defineProperty({ ...values }, ENUM_NAME_SYMBOL, {
    value: name,
    enumerable: false,
    writable: false,
    configurable: false,
  });
}

/**
 * Retrieves the enumName associated with a defineEnum object, if present.
 */
export function getEnumName(enumObj: unknown): string | undefined {
  if (!enumObj || typeof enumObj !== 'object') return undefined;
  return (enumObj as Record<symbol, unknown>)[ENUM_NAME_SYMBOL] as string | undefined;
}
