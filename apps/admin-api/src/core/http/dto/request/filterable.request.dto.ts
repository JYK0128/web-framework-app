import type { ObjectQuery } from '@mikro-orm/core';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class FilterableRequestDto<TEntity extends object> extends BaseDto {
  toFilterQuery(): ObjectQuery<TEntity> {
    return {};
  }
}
