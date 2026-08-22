import type { EntityName, FilterQuery, FindOptions, Loaded } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager, type PostgreSqlDriver } from '@mikro-orm/postgresql';

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

export class AppEntityManager extends PostgreSqlEntityManager<PostgreSqlDriver> {
  async findByPage<
    TEntity extends object,
    THint extends string = never,
    TFields extends string = never,
    TExcludes extends string = never,
  >(
    entityName: EntityName<TEntity>,
    where: FilterQuery<TEntity>,
    options: PageFindOptions<TEntity, THint, TFields, TExcludes>,
  ): Promise<PageResult<Loaded<TEntity, THint, TFields, TExcludes>>> {
    const { page, limit, ...findOptions } = options;
    const [items, totalCount] = await this.findAndCount<TEntity, THint, TFields, TExcludes>(
      entityName,
      where as never,
      {
        ...findOptions,
        limit,
        offset: (page - 1) * limit,
      } as never,
    );
    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1 && totalCount > 0,
      totalCount,
    };
  }
}
