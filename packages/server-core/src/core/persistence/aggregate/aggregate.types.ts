import type { FilterQuery, RawQueryFragment } from '@mikro-orm/core';

import type { AggregateFieldType, AggregateFunction } from './aggregate.rules';

export type AggregateMetricSpec<TEntity extends object> = {
  fn: AggregateFunction
  field?: keyof TEntity & string
  valueType?: AggregateFieldType
};

export type AggregateSpec<TEntity extends object> = Record<string, AggregateMetricSpec<TEntity>>;

export type AggregateGroupExpression<TField extends string = string> = {
  field: TField
  expression: (alias: string) => RawQueryFragment
};

export type AggregateHaving = {
  field: string
  op: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne'
  value: number | string | Date
};

export type AggregateOrderBy = { field: string, direction: 'asc' | 'desc' };

export interface AggregateOptions<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[] = readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity> = AggregateSpec<TEntity>,
  TExpressionGroupBy extends string = never,
> {
  where?: FilterQuery<TEntity>
  groupBy?: TGroupBy
  groupByExpressions?: readonly AggregateGroupExpression<TExpressionGroupBy>[]
  aggregates: TAggregates
  having?: AggregateHaving[]
  orderBy?: AggregateOrderBy[]
  take?: number
}

export type AggregateValue<TSpec> = TSpec extends { fn: 'count' } ? number : number | string | Date | null;
export type AggregateResult<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity>,
  TExpressionGroupBy extends string = never,
> = Partial<Pick<TEntity, TGroupBy[number]>> & {
  [K in keyof TAggregates]: AggregateValue<TAggregates[K]>
} & Record<TExpressionGroupBy, string | number | Date | null>;
