type Narrowed<P, T> = P extends (value: T) => value is infer S & T ? S : T;

export function valueIf<T, F = undefined>(
  condition: boolean,
  whenTrue: T,
  whenFalse?: F,
): T | F | undefined {
  return condition ? whenTrue : whenFalse;
}

export function when<T, P extends (value: T) => boolean, R, F = never>(
  predicate: P,
  onTrue: (value: Narrowed<P, T>) => R,
  onFalse?: (value: T) => F,
): (value: T) => R | F | undefined;

export function when<T, P extends (value: T) => boolean, R, F = never>(
  predicate: P,
  onTrue: (value: Narrowed<P, T>) => R,
  onFalse?: (value: T) => F,
): (value: T) => R | F | undefined {
  return (value: T) => predicate(value)
    ? onTrue(value as Narrowed<P, T>)
    : onFalse?.(value);
}
