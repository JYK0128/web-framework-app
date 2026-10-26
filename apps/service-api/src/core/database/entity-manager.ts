import { type EntityName, type FilterQuery, type FindOptions, type Loaded, raw } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager, type PostgreSqlDriver } from '@mikro-orm/postgresql';
import type { AggregateFunction, AggregateOptions, AggregateResult, AggregateSpec } from '@pkg/server-core/http/dto/request';

type AggregateDefinition = { fn: AggregateFunction, field?: string };

function normalizeAggregateRows<TAggregates extends Record<string, AggregateDefinition>>(
  rows: Record<string, unknown>[],
  aggregates: TAggregates,
): Record<string, unknown>[] {
  return rows.map((row) => {
    const normalized = { ...row };
    for (const [name, aggregate] of Object.entries(aggregates)) {
      const value = normalized[name];
      if ((value === null || value === undefined) && aggregate.fn !== 'count') continue;
      if (value === null || value === undefined) throw new TypeError(`Aggregate ${name} returned null for count`);
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(numberValue)) throw new TypeError(`Aggregate ${name} did not return a finite number`);
      if (aggregate.fn === 'count' && !Number.isSafeInteger(numberValue)) {
        throw new RangeError(`Aggregate ${name} exceeds JavaScript's safe integer range`);
      }
      normalized[name] = numberValue;
    }
    return normalized;
  });
}

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
  async aggregate<
    TEntity extends object,
    TGroupBy extends readonly (keyof TEntity & string)[] = [],
    TAggregates extends AggregateSpec<TEntity> = AggregateSpec<TEntity>,
  >(
    entityName: EntityName<TEntity>,
    options: AggregateOptions<TEntity, TGroupBy, TAggregates>,
  ): Promise<AggregateResult<TEntity, TGroupBy, TAggregates>[]> {
    if (options.take !== undefined && (!Number.isInteger(options.take) || options.take < 1)) {
      throw new RangeError('Aggregate take must be a positive integer');
    }
    if (Object.keys(options.aggregates).length === 0) throw new TypeError('At least one aggregate is required');
    const alias = 'entity';
    const selections = [
      ...(options.groupBy ?? []).map((field) => `${alias}.${field}`),
      ...Object.entries(options.aggregates).map(([name, aggregate]) => {
        if (!/^[A-Za-z_]\w*$/.test(name)) throw new TypeError(`Invalid aggregate alias: ${name}`);
        if (aggregate.fn !== 'count' && !aggregate.field) {
          throw new TypeError(`Aggregate ${name} requires a field unless it is count(*)`);
        }
        return aggregate.field === undefined
          ? raw(`count(*) as ??`, [name])
          : raw(`${aggregate.fn}(??.??) as ??`, [alias, aggregate.field, name]);
      }),
    ];
    const qb = this.createQueryBuilder(entityName, alias).select(selections as never).where((options.where ?? {}) as never);
    for (const field of options.groupBy ?? []) qb.groupBy(`${alias}.${field}` as never);
    for (const condition of options.having ?? []) {
      if (!Object.hasOwn(options.aggregates, condition.field)) {
        throw new TypeError(`Unknown aggregate alias in having: ${condition.field}`);
      }
      if (!/^[A-Za-z_]\w*$/.test(condition.field)) throw new TypeError(`Invalid aggregate alias: ${condition.field}`);
      const operators = { $gt: '>', $gte: '>=', $lt: '<', $lte: '<=', $eq: '=', $ne: '<>' } as const;
      qb.having(`"${condition.field}" ${operators[condition.op]} ?`, [condition.value]);
    }
    const aggregateOrder = (options.orderBy ?? []).filter(({ field }) => Object.hasOwn(options.aggregates, field));
    const entityOrder = (options.orderBy ?? []).filter(({ field }) => !Object.hasOwn(options.aggregates, field));
    if (entityOrder.length) qb.orderBy(Object.fromEntries(entityOrder.map(({ field, direction }) => [field, direction])) as never);
    if (options.take !== undefined) qb.limit(options.take);
    if (aggregateOrder.length) {
      const nativeQuery = qb.getNativeQuery();
      for (const { field, direction } of aggregateOrder) {
        nativeQuery.orderBy(`"${field}" ${direction}`);
      }
    }
    const rows = await qb.execute<Record<string, unknown>[]>('all');
    return normalizeAggregateRows(rows, options.aggregates) as AggregateResult<TEntity, TGroupBy, TAggregates>[];
  }

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
