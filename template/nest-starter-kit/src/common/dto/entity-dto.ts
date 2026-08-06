import { type Type } from '@nestjs/common';
import { PartialType, PickType } from '@nestjs/swagger';

type UnionToIntersection<T> = (T extends unknown ? (value: T) => void : never) extends (value: infer I) => void
  ? I
  : never;

type ExtractEntityInstance<T> = T extends Type<infer I>
  ? I
  : T extends readonly Type<object>[]
    ? UnionToIntersection<InstanceType<T[number]>>
    : T extends object
      ? T
      : never;

export type EntityInterface<T> = Partial<ExtractEntityInstance<T>> & object;

export type DtoPickedEntity<T, K extends keyof T> = Partial<{
  [P in K]: NonNullable<T[P]> | null;
}>;

/**
 * Creates a Mapped Type class that picks specified keys from classRef and makes them optional & nullable for clean DTO inheritance.
 */
export function DtoType<T, K extends keyof T>(
  classRef: Type<T>,
  keys: readonly K[],
): Type<DtoPickedEntity<T, K>> {
  const PickedClass = PickType(classRef, keys as unknown as (keyof T)[]);
  const PartialClass = PartialType(PickedClass);

  abstract class DtoTypeClass extends (PartialClass as Type<object>) {}

  return DtoTypeClass as unknown as Type<DtoPickedEntity<T, K>>;
}
