export { };

declare global {
  type Prettify<T> = {
    [P in keyof T]: T[P];
  } & {};

  type Key = string | number | symbol;
  type Numberable = string | number | bigint;
  type Primitive = string | number | bigint | boolean;
  type Literal<T> = T extends string ? string extends T ? never : T : never;
  type Tuple<T> = T extends [] ? [] : T extends [infer First, ...infer Rest] ? [First, ...Tuple<Rest>] : never;
  type Nullish<T> = T | undefined | null;
  type Nullable<T> = T | null;
  type Maybe<T> = T | undefined;

  type Mutable<T> = Prettify<{
    -readonly [P in keyof T]: T[P];
  }>;
  type ValueOf<T, R extends keyof T = keyof T> = T[R];
  type KeyOf<T, V = unknown> = {
    [K in keyof T]: T[K] extends V ? K : never;
  }[Extract<keyof T, string>];
  type Entry<T> = {
    [K in keyof T]: [K, T[K]]
  }[keyof T];

  type Awaitable<T> = T | Promise<T>;
  type Updater<T> = T | ((old: T) => T);
  type Setter<T> = (value: Updater<T>) => void;
  type Producer<T> = () => T;
  type Callback<T = void> = (value: T) => void;
  type Task<T = void> = () => Awaitable<T>;
  type Resolvable<T = void> = Awaitable<T> | Task<T>;

  type Merge<A, B> = Prettify<Omit<A, keyof B> & B>;
  type Mandatory<T, K extends keyof T = keyof T>
    = Prettify<Required<Pick<T, K>> & Partial<Omit<T, K>>>;
  type Optional<T, K extends keyof T = keyof T>
    = Prettify<Partial<Pick<T, K>> & Omit<T, K>>;
  type DeepPartial<T> = Prettify<{
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
  }>;
}
