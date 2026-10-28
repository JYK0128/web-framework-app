import 'reflect-metadata';

import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';

import { EntityCaseNamingStrategy, raw } from '@mikro-orm/core';
import { Entity, Filter, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';
import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { AppEntityManager } from '@pkg/server-core/core/persistence';
import { AggregateRequestDto, QueryRequestDto } from '@pkg/server-core/http/dto/request';
import { ApplicationError } from '@pkg/shared/common';

@Entity({ tableName: 'aggregate_fixture' })
@Filter({ name: 'softDelete', cond: { deletedAt: null }, default: true })
class AggregateFixture {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  category!: string;

  @Property({ type: 'double' })
  amount!: number;

  @Property({ type: 'boolean' })
  active!: boolean;

  @Property({ type: 'timestamptz', nullable: true })
  occurredAt!: Date | null;

  @Property({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}

const aggregateDefinition = {
  fields: {
    amount: { field: 'amount', type: 'number' },
    occurredAt: { field: 'occurredAt', type: 'date' },
    category: { field: 'category', type: 'string' },
    active: { field: 'active', type: 'boolean' },
  },
  dimensions: {
    category: { field: 'category' },
    bucket: { expression: (alias) => raw(`case when ??.?? >= 30 then 'large' else 'small' end`, [alias, 'amount']) },
  },
  defaultMetrics: [{ name: 'eventCount', function: 'count' }],
} as const;

const AggregateBody = AggregateRequestDto(AggregateFixture, aggregateDefinition);
const FilteredQuery = QueryRequestDto(AggregateFixture, {
  filter: { amount: { type: 'number' } },
  search: { fields: ['category'] },
});

const url = process.env.AGGREGATE_TEST_DATABASE_URL;
if (!url) throw new Error('AGGREGATE_TEST_DATABASE_URL must point to an isolated test database');

let orm: MikroORM<AppEntityManager, (typeof AggregateFixture)[]>;
let em: AppEntityManager;

before(async () => {
  orm = await MikroORM.init({
    driver: PostgreSqlDriver,
    entityManager: AppEntityManager,
    clientUrl: url,
    entities: [AggregateFixture],
    namingStrategy: EntityCaseNamingStrategy,
  });
  await orm.em.getConnection().execute('drop table if exists "aggregate_fixture"');
  await orm.schema.create();
  em = orm.em.fork();
  await em.insertMany(AggregateFixture, [
    { id: 1, category: 'A', amount: 10, active: true, occurredAt: new Date('2026-01-01T00:00:00Z'), deletedAt: null },
    { id: 2, category: 'A', amount: 30, active: true, occurredAt: new Date('2026-01-03T00:00:00Z'), deletedAt: null },
    { id: 3, category: 'B', amount: 50, active: false, occurredAt: null, deletedAt: null },
    { id: 4, category: 'A', amount: 100, active: true, occurredAt: new Date('2026-01-20T00:00:00Z'), deletedAt: new Date('2026-01-21T00:00:00Z') },
  ]);
});

after(async () => {
  if (!orm) return;
  try {
    await orm.em.getConnection().execute('drop table if exists "aggregate_fixture"');
  }
  finally {
    await orm.close(true);
  }
});

void test('overall count applies default entity filters', async () => {
  const request = AggregateBody.parse({}).validate();
  const rows = await em.aggregate(AggregateFixture, request.toQuery());
  assert.deepEqual(rows, [{ eventCount: 3 }]);
});

void test('grouped count, numeric aggregates and date aggregates use the requested fields', async () => {
  const request = AggregateBody.parse({
    groupBy: ['category'],
    metrics: [
      { name: 'count', function: 'count' },
      { name: 'datedCount', function: 'count', field: 'occurredAt' },
      { name: 'sum', function: 'sum', field: 'amount' },
      { name: 'averageAmount', function: 'avg', field: 'amount' },
      { name: 'maxAmount', function: 'max', field: 'amount' },
      { name: 'firstCategory', function: 'min', field: 'category' },
      { name: 'activeCount', function: 'count', field: 'active' },
      { name: 'earliest', function: 'min', field: 'occurredAt' },
      { name: 'latest', function: 'max', field: 'occurredAt' },
      { name: 'averageDate', function: 'avg', field: 'occurredAt' },
    ],
  }).validate();
  const rows = await em.aggregate(AggregateFixture, {
    ...request.toQuery(),
    orderBy: [{ field: 'sum', direction: 'desc' }, { field: 'category', direction: 'asc' }],
  });
  assert.deepEqual(rows, [
    { category: 'B', count: 1, datedCount: 0, sum: 50, averageAmount: 50, maxAmount: 50, firstCategory: 'B', activeCount: 1, earliest: null, latest: null, averageDate: null },
    { category: 'A', count: 2, datedCount: 2, sum: 40, averageAmount: 20, maxAmount: 30, firstCategory: 'A', activeCount: 2, earliest: new Date('2026-01-01T00:00:00.000Z'), latest: new Date('2026-01-03T00:00:00.000Z'), averageDate: new Date('2026-01-02T00:00:00.000Z') },
  ]);
});

void test('computed group expressions are evaluated in the database', async () => {
  const request = AggregateBody.parse({ groupBy: ['bucket'] }).validate();
  const rows = await em.aggregate(AggregateFixture, request.toQuery());
  assert.deepEqual(rows.toSorted((a, b) => String(a.bucket).localeCompare(String(b.bucket))), [
    { bucket: 'large', eventCount: 2 },
    { bucket: 'small', eventCount: 1 },
  ]);
});

void test('unsupported field and function combinations fail before querying', () => {
  const invalidRequests = [
    { metrics: [{ name: 'sum', function: 'sum', field: 'occurredAt' }] },
    { metrics: [{ name: 'average', function: 'avg', field: 'active' }] },
    { metrics: [{ name: 'x', function: 'count' }, { name: 'x', function: 'count' }] },
    { metrics: [{ name: 'x', function: 'max', field: 'deletedAt' }] },
    { groupBy: ['category'], metrics: [{ name: 'category', function: 'count' }] },
  ];
  for (const input of invalidRequests) {
    assert.throws(() => AggregateBody.parse(input).validate().toQuery(), (error) =>
      error instanceof ApplicationError && error.code === 'VALIDATION_ERROR' && error.status === 400);
  }
});

void test('filter and search combine with a separate aggregate request in the database', async () => {
  const request = FilteredQuery.parse({ search: 'A', filters: { amount: { gte: 20 } } }).validate();
  const aggregate = AggregateBody.parse({}).validate();
  assert.deepEqual(await em.aggregate(AggregateFixture, { ...aggregate.toQuery(), where: request.toQuery().where }), [{ eventCount: 1 }]);
});

void test('database aggregate expressions reject unsupported input types', async () => {
  await assert.rejects(em.aggregate(AggregateFixture, { aggregates: { invalid: { fn: 'avg', field: 'active', valueType: 'boolean' } } }), /does not support boolean/);
  await assert.rejects(em.aggregate(AggregateFixture, { aggregates: { invalid: { fn: 'sum' } } }), /requires a field/);
});
