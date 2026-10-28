import type { ObjectQuery, QueryOrderMap } from '@mikro-orm/core';
import type { Type } from '@nestjs/common';

import type { BaseDto } from '../../base/base.dto';

export type QueryOptions<TEntity extends object> = {
  where: ObjectQuery<TEntity>
  orderBy?: QueryOrderMap<TEntity> | QueryOrderMap<TEntity>[]
  page?: number
  limit?: number
  after?: string
  first?: number
};
export type QueryBase<TEntity extends object> = BaseDto & { toQuery(): QueryOptions<TEntity> };
export type QueryBaseClass<TEntity extends object> = Type<QueryBase<TEntity>>;

export function combineQuery<TEntity extends object>(...queries: (ObjectQuery<TEntity> | null)[]): ObjectQuery<TEntity> {
  const conditions = queries.filter((query): query is ObjectQuery<TEntity> => !!query && Object.keys(query).length > 0);
  return (conditions.length ? { $and: conditions } : {}) as ObjectQuery<TEntity>;
}
