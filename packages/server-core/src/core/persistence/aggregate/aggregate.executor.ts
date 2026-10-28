import { type EntityMetadata, type EntityName, raw, type RawQueryFragment } from '@mikro-orm/core';
import { EntityManager as PostgreSqlEntityManager, type PostgreSqlDriver } from '@mikro-orm/postgresql';

import { AGGREGATE_FUNCTION_RULES, AGGREGATE_FUNCTIONS, type AggregateFieldType, type AggregateFunction } from './aggregate.rules';
import { type AggregateMetricSpec, type AggregateOptions, type AggregateResult, type AggregateSpec } from './aggregate.types';

function aggregateExpression(fn: AggregateFunction, valueType: AggregateFieldType | undefined, alias: string, column: string | undefined, name: string): RawQueryFragment {
  if (!AGGREGATE_FUNCTIONS.includes(fn)) throw new TypeError(`Unsupported aggregate function: ${fn}`);
  const rule = AGGREGATE_FUNCTION_RULES[fn];
  if (!column) {
    if (fn !== 'count') throw new TypeError(`Aggregate ${name} requires a field unless it is count(*)`);
    return raw('count(*) as ??', [name]);
  }
  if (valueType && !rule.fieldTypes.includes(valueType)) throw new TypeError(`Aggregate ${fn} does not support ${valueType}`);
  if (fn === 'avg' && valueType === 'date') return raw('to_timestamp(avg(extract(epoch from ??.??))) as ??', [alias, column, name]);
  return raw(`${fn}(??.??) as ??`, [alias, column, name]);
}

function normalizeDate(name: string, value: unknown): Date {
  if (!(value instanceof Date) && typeof value !== 'string' && typeof value !== 'number') {
    throw new TypeError(`Aggregate ${name} did not return a valid date`);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Aggregate ${name} did not return a valid date`);
  return date;
}

function normalizeValue<TEntity extends object>(name: string, value: unknown, aggregate: AggregateMetricSpec<TEntity>): unknown {
  if (value === null || value === undefined) {
    if (aggregate.fn === 'count') throw new TypeError(`Aggregate ${name} returned null for count`);
    return null;
  }
  if (aggregate.fn !== 'count' && (aggregate.valueType === 'date' || value instanceof Date)) return normalizeDate(name, value);
  if (aggregate.fn !== 'count' && aggregate.valueType === 'string') {
    if (typeof value !== 'string') throw new TypeError(`Aggregate ${name} did not return a string`);
    return value;
  }
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
    throw new TypeError(`Aggregate ${name} did not return a finite number`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError(`Aggregate ${name} did not return a finite number`);
  if (aggregate.fn === 'count' && !Number.isSafeInteger(number)) throw new RangeError(`Aggregate ${name} exceeds JavaScript's safe integer range`);
  return number;
}

function applyHavingConditions<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[],
  TAggregates extends AggregateSpec<TEntity>,
  TExpressionGroupBy extends string,
>(
  addHaving: (condition: string, parameters: unknown[]) => void,
  metadata: EntityMetadata<TEntity>,
  alias: string,
  options: AggregateOptions<TEntity, TGroupBy, TAggregates, TExpressionGroupBy>,
): void {
  const operators = { gt: '>', gte: '>=', lt: '<', lte: '<=', eq: '=', ne: '<>' } as const;
  for (const condition of options.having ?? []) {
    if (!Object.hasOwn(options.aggregates, condition.field)) throw new TypeError(`Unknown aggregate alias in having: ${condition.field}`);
    if (!Object.hasOwn(operators, condition.op)) throw new TypeError(`Unknown aggregate having operator: ${condition.op}`);
    const aggregate = options.aggregates[condition.field];
    const operator = operators[condition.op];
    if (!aggregate.field) {
      addHaving(`count(*) ${operator} ?`, [condition.value]);
      continue;
    }
    const property = metadata.properties[aggregate.field as keyof typeof metadata.properties];
    const column = property.fieldNames[0];
    if (aggregate.fn === 'avg' && aggregate.valueType === 'date') {
      addHaving(`to_timestamp(avg(extract(epoch from ??.??))) ${operator} ?`, [alias, column, condition.value]);
    }
    else addHaving(`${aggregate.fn}(??.??) ${operator} ?`, [alias, column, condition.value]);
  }
}

/** Runs an aggregate query and normalizes PostgreSQL result values. */
export async function executeAggregate<
  TEntity extends object,
  TGroupBy extends readonly (keyof TEntity & string)[] = [],
  TAggregates extends AggregateSpec<TEntity> = AggregateSpec<TEntity>,
  TExpressionGroupBy extends string = never,
>(
  em: PostgreSqlEntityManager<PostgreSqlDriver>,
  entityName: EntityName<TEntity>,
  options: AggregateOptions<TEntity, TGroupBy, TAggregates, TExpressionGroupBy>,
): Promise<AggregateResult<TEntity, TGroupBy, TAggregates, TExpressionGroupBy>[]> {
  if (options.take !== undefined && (!Number.isInteger(options.take) || options.take < 1)) throw new RangeError('Aggregate take must be a positive integer');
  if (Object.keys(options.aggregates).length === 0) throw new TypeError('At least one aggregate is required');

  const alias = 'entity';
  const metadata = em.getMetadata().get(entityName);
  const names = new Set<string>(options.groupBy ?? []);
  const groupByExpressions = (options.groupByExpressions ?? []).map(({ field, expression }) => ({ field, expression: expression(alias) }));
  const selections = [
    ...(options.groupBy ?? []).map((field) => `${alias}.${field}`),
    ...groupByExpressions.map(({ field, expression }) => {
      if (!/^[A-Za-z_]\w*$/.test(field) || names.has(field)) throw new TypeError(`Invalid aggregate group alias: ${field}`);
      names.add(field);
      return expression.as(field);
    }),
    ...Object.entries(options.aggregates).map(([name, aggregate]) => {
      if (!/^[A-Za-z_]\w*$/.test(name) || names.has(name)) throw new TypeError(`Invalid aggregate alias: ${name}`);
      names.add(name);
      if (!aggregate.field) return aggregateExpression(aggregate.fn, aggregate.valueType, alias, undefined, name);
      const property = metadata.properties[aggregate.field as keyof typeof metadata.properties];
      if (!property || property.persist === false || property.formula || property.fieldNames?.length !== 1) {
        throw new TypeError(`Aggregate ${name} requires a persisted scalar field`);
      }
      return aggregateExpression(aggregate.fn, aggregate.valueType, alias, property.fieldNames[0], name);
    }),
  ];

  const qb = em.createQueryBuilder(entityName, alias).select(selections as never).where((options.where ?? {}) as never);
  await qb.applyFilters();
  for (const field of options.groupBy ?? []) qb.groupBy(`${alias}.${field}` as never);
  for (const { expression } of groupByExpressions) qb.groupBy(expression as never);
  applyHavingConditions(
    (condition, parameters) => {
      qb.having(condition, parameters as never);
    },
    metadata,
    alias,
    options,
  );
  const expressionNames = new Set<string>(groupByExpressions.map(({ field }) => field));
  const orderBy = (options.orderBy ?? []).map(({ field, direction }) => {
    if (!names.has(field) || (direction !== 'asc' && direction !== 'desc')) throw new TypeError(`Invalid aggregate order: ${field}`);
    if (Object.hasOwn(options.aggregates, field) || expressionNames.has(field)) return { [raw('??', [field])]: direction };
    return { [field]: direction };
  });
  if (orderBy.length) qb.orderBy(orderBy as never);
  if (options.take !== undefined) qb.limit(options.take);

  const rows = await qb.execute<Record<string, unknown>[]>('all');
  return rows.map((row) => {
    const result = { ...row };
    for (const [name, aggregate] of Object.entries(options.aggregates)) result[name] = normalizeValue(name, result[name], aggregate);
    return result;
  }) as AggregateResult<TEntity, TGroupBy, TAggregates, TExpressionGroupBy>[];
}
