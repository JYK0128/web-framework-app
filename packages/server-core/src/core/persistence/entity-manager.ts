import { type EntityName, type FilterQuery, type Loaded } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager, type PostgreSqlDriver } from '@mikro-orm/postgresql';

import { executeAggregate } from './aggregate/aggregate.executor';
import { type AggregateOptions, type AggregateResult, type AggregateSpec } from './aggregate/aggregate.types';
import { findByPage } from './pagination/pagination.executor';
import { type PageFindOptions, type PageResult } from './pagination/pagination.types';

/** Shared PostgreSQL EntityManager used by the API applications. */
export class AppEntityManager extends PostgreSqlEntityManager<PostgreSqlDriver> {
  findByPage<
    TEntity extends object,
    THint extends string = never,
    TFields extends string = never,
    TExcludes extends string = never,
  >(
    entityName: EntityName<TEntity>,
    where: FilterQuery<TEntity>,
    options: PageFindOptions<TEntity, THint, TFields, TExcludes>,
  ): Promise<PageResult<Loaded<TEntity, THint, TFields, TExcludes>>> {
    return findByPage(this, entityName, where, options);
  }

  aggregate<
    TEntity extends object,
    TGroupBy extends readonly (keyof TEntity & string)[] = [],
    TAggregates extends AggregateSpec<TEntity> = AggregateSpec<TEntity>,
    TExpressionGroupBy extends string = never,
  >(
    entityName: EntityName<TEntity>,
    options: AggregateOptions<TEntity, TGroupBy, TAggregates, TExpressionGroupBy>,
  ): Promise<AggregateResult<TEntity, TGroupBy, TAggregates, TExpressionGroupBy>[]> {
    return executeAggregate(this, entityName, options);
  }
}
