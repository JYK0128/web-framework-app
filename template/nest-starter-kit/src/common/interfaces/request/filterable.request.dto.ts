import type { ObjectQuery } from '@mikro-orm/core';

import { BaseEntity } from '#/entities/common/base.entity';

export class FilterableRequestDto<TEntity extends BaseEntity> {
  toFilterQuery(): ObjectQuery<TEntity> {
    return {};
  }
}
