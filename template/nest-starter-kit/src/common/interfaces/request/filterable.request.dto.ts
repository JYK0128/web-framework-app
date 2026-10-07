import type { ObjectQuery } from '@mikro-orm/core';

import { BaseDto } from '#/common/dto/base.dto';
import { BaseEntity } from '#/entities/common/base.entity';

export class FilterableRequestDto<TEntity extends BaseEntity> extends BaseDto {
  toFilterQuery(): ObjectQuery<TEntity> {
    return {};
  }
}
