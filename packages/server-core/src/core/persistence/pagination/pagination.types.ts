import type { FindOptions } from '@mikro-orm/core';

export type PageFindOptions<
  TEntity extends object,
  THint extends string = never,
  TFields extends string = never,
  TExcludes extends string = never,
> = Omit<FindOptions<TEntity, THint, TFields, TExcludes>, 'limit' | 'offset'> & {
  page: number
  limit: number
};

export interface PageResult<TEntity extends object> {
  items: TEntity[]
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
  totalCount: number
}
