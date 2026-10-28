import type { EntityName, FilterQuery, Loaded } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager, type PostgreSqlDriver } from '@mikro-orm/postgresql';

import { type PageFindOptions, type PageResult } from './pagination.types';

/** Fetches a page and total count using MikroORM's findAndCount. */
export async function findByPage<
  TEntity extends object,
  THint extends string = never,
  TFields extends string = never,
  TExcludes extends string = never,
>(
  em: PostgreSqlEntityManager<PostgreSqlDriver>,
  entityName: EntityName<TEntity>,
  where: FilterQuery<TEntity>,
  options: PageFindOptions<TEntity, THint, TFields, TExcludes>,
): Promise<PageResult<Loaded<TEntity, THint, TFields, TExcludes>>> {
  const { page, limit, ...findOptions } = options;
  const [items, totalCount] = await em.findAndCount<TEntity, THint, TFields, TExcludes>(
    entityName,
    where as never,
    { ...findOptions, limit, offset: (page - 1) * limit } as never,
  );
  const totalPages = Math.ceil(totalCount / limit);

  return { items, page, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 && totalCount > 0, totalCount };
}
