import type { ObjectQuery } from '@mikro-orm/core';

import { BaseDto } from '../base/base.dto';

export class FilterableRequestDto<TEntity extends object> extends BaseDto {
  toFilterQuery(): ObjectQuery<TEntity> {
    return {};
  }
}
