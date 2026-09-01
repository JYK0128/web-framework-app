export { };

declare global {
  type Key = string | number | symbol;
  type Numberable = string | number | bigint;
  type Primitive = string | number | bigint | boolean;
  type Literal<T> = T extends string ? string extends T ? never : T : never;
  type Tuple<T> = T extends [] ? [] : T extends [infer First, ...infer Rest] ? [First, ...Tuple<Rest>] : never;
  type Nullish<T> = T | undefined | null;
  type Nullable<T> = T | null;
  type Maybe<T> = T | undefined;
  type Mutable<T> = {
    -readonly [P in keyof T]: T[P]
  };

  type Awaitable<T> = T | Promise<T>;
  type Updater<T> = T | ((old: T) => T);
  type Producer<T> = () => T;
  type Callback<T = void> = (value: T) => void;

  type Prettify<T> = {
    [P in keyof T]: T[P];
  } & {};
  type Mandatory<T, K extends keyof T = keyof T>
    = Prettify<Required<Pick<T, K>> & Partial<Omit<T, K>>>;
  type Optional<T, K extends keyof T = keyof T>
    = Prettify<Partial<Pick<T, K>> & Omit<T, K>>;
}
