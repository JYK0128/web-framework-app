import type { ObjectQuery } from '@mikro-orm/core';

import { BaseEntity } from '#/core/database/entities/common/base.entity';
import { BaseDto } from '#/core/http/dto/base/base.dto';

export class FilterableRequestDto<TEntity extends BaseEntity> extends BaseDto {
  toFilterQuery(): ObjectQuery<TEntity> {
    return {};
  }
}
