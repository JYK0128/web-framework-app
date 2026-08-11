import type { ObjectQuery } from '@mikro-orm/core';

export abstract class FilterableRequestDto<TEntity extends object> {
  abstract toFilterQuery(): ObjectQuery<TEntity>;
}
