import { type Collection } from '@mikro-orm/core';
import { type Type } from '@nestjs/common';

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void
  ? I
  : never;

type ExtractEntityInstances<T extends readonly Type<object>[]> = UnionToIntersection<
  InstanceType<T[number]>
>;

type FilterEntityKeys<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown
    ? never
    : T[K] extends Collection<object, object>
      ? never
      : K;
}[keyof T];

export type DtoEntityFields<T extends readonly Type<object>[]> = Partial<{
  [K in FilterEntityKeys<ExtractEntityInstances<T>>]: NonNullable<ExtractEntityInstances<T>[K]> | null;
}>;

/**
 * Creates a zero-cost dummy class for DTOs to inherit TypeScript type hints from one or more entities
 * without leaking DB metadata or polluting OpenAPI / Swagger schemas.
 */
export function DtoType<T extends readonly Type<object>[]>(
  ..._entities: T
): Type<DtoEntityFields<T>> {
  abstract class DtoTypeDummyClass {}
  return DtoTypeDummyClass as unknown as Type<DtoEntityFields<T>>;
}
