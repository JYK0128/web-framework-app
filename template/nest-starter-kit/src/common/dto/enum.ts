export const ENUM_NAME_SYMBOL = Symbol('enumName');

export type DefinedEnum<T extends Record<string, string | number>> = T & {
  readonly [ENUM_NAME_SYMBOL]?: string
};

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

export function getEnumName(enumObj: unknown): string | undefined {
  if (!enumObj || typeof enumObj !== 'object') return undefined;
  return (enumObj as Record<symbol, unknown>)[ENUM_NAME_SYMBOL] as string | undefined;
}
