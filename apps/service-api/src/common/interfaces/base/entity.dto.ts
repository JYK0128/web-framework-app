import { type Collection } from '@mikro-orm/core';
import { type Type } from '@nestjs/common';

import { BaseDto } from './base.dto';

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
      : K extends 'role' | 'metadata'
        ? never
        : K;
}[keyof T];

export type EntityDtoFields<T extends readonly Type<object>[]> = Partial<{
  [K in FilterEntityKeys<ExtractEntityInstances<T>>]: NonNullable<ExtractEntityInstances<T>[K]> | null;
}>;

type EntityDtoInstances<T extends readonly Type<object>[]> = {
  -readonly [K in keyof T]: InstanceType<T[K]>;
};

type EntityDtoFactory<T extends readonly Type<object>[]> = {
  from(...args: [...EntityDtoInstances<T>, ...unknown[]]): BaseDto
};

/**
 * Provides entity field type hints without exposing DB metadata or Swagger fields.
 * Entity mapping DTOs must override static from(); calling the inherited method throws.
 * from() preserves the entity argument types and order, followed by optional mapping arguments.
 */
export function EntityDto<T extends readonly Type<object>[]>(
  ..._entities: T
): Type<EntityDtoFields<T> & BaseDto> & typeof BaseDto & EntityDtoFactory<T> {
  abstract class EntityDtoDummyClass extends BaseDto {
    static from(..._args: [...EntityDtoInstances<T>, ...unknown[]]): BaseDto {
      throw new Error(`${this.name}.from must be implemented`);
    }
  }

  return EntityDtoDummyClass as unknown as Type<EntityDtoFields<T> & BaseDto>
    & typeof BaseDto
    & EntityDtoFactory<T>;
}
