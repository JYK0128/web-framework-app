import { type Type } from '@nestjs/common';

import { BaseDto } from './base.dto';
import { type EntityDtoFields } from './entity.dto';

type EntityResponseDtoFactory<TEntity extends Type<object>> = {
  from(entity: InstanceType<TEntity>, ...args: unknown[]): BaseDto
};

/**
 * Creates an entity-backed response DTO base with a typed static `from` contract.
 * The concrete DTO owns the mapping implementation and may add typed arguments.
 */
export function EntityResponseDto<TEntity extends Type<object>>(
  _entity: TEntity,
): Type<EntityDtoFields<[TEntity]> & BaseDto> & typeof BaseDto & EntityResponseDtoFactory<TEntity> {
  abstract class EntityResponseDtoDummyClass extends BaseDto {
    static from(_entity: InstanceType<TEntity>, ..._args: unknown[]): BaseDto {
      throw new Error(`${this.name}.from must be implemented`);
    }
  }

  return EntityResponseDtoDummyClass as unknown as Type<EntityDtoFields<[TEntity]> & BaseDto>
    & typeof BaseDto
    & EntityResponseDtoFactory<TEntity>;
}
