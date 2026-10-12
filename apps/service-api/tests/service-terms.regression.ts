import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { ApplicationError } from '@pkg/shared/common';
import { entities } from '../src/entities.generated';
import { AppEntityManager } from '../src/core/database/entity-manager';
import { Term, TermGroup } from '../src/core/database/entities/terms';
import { CreateInternalServiceTermRequestDto } from '../src/modules/service-terms/create-internal-service-term.request.dto';
import { UpdateInternalServiceTermRequestDto } from '../src/modules/service-terms/update-internal-service-term.request.dto';
import { UpdateInternalServiceTermGroupRequestDto } from '../src/modules/service-terms/groups/update-internal-service-term-group.request.dto';
import { UpdateInternalServiceTermGroupCommand } from '../src/modules/service-terms/groups/internal-service-term-group.commands';
import { UpdateInternalServiceTermGroupHandler } from '../src/modules/service-terms/groups/internal-service-term-group-actions.handler';
import { CreateInternalServiceTermCommand, UpdateInternalServiceTermCommand } from '../src/modules/service-terms/internal-service-term.commands';
import { CreateInternalServiceTermHandler, UpdateInternalServiceTermHandler } from '../src/modules/service-terms/internal-service-term-actions.handler';
import { Migration20261012010000 } from '../src/core/database/migrations/Migration20261012010000_service-term-version-uniqueness';

import { GetTermRevisionsHandler } from '../src/modules/service-terms/revisions/get-term-revisions.handler';
import { GetTermRevisionsQuery } from '../src/modules/service-terms/revisions/get-term-revisions.query';
import { GetTermRevisionsRequestDto } from '../src/modules/service-terms/revisions/term-revision.dto';
const invalid = (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR';
const conflict = (error: unknown) => error instanceof ApplicationError && error.code === 'SERVICE_TERM_VERSION_ALREADY_EXISTS' && error.status === 409;
test('internal update DTOs reject invalid versions and null fields; retain omission/cancellation', () => {
  for (const version of ['', 'x'.repeat(51)]) assert.throws(() => UpdateInternalServiceTermRequestDto.parse({ version }).validate(), invalid);
  for (const field of ['groupId', 'version', 'content', 'reason', 'summary', 'isNoticeRequired']) assert.throws(() => UpdateInternalServiceTermRequestDto.parse({ [field]: null }).validate(), invalid);
  for (const field of ['title', 'isRequired', 'sortOrder']) assert.throws(() => UpdateInternalServiceTermGroupRequestDto.parse({ [field]: null }).validate(), invalid);
  assert.doesNotThrow(() => UpdateInternalServiceTermRequestDto.parse({ publishedAt: null, metadata: null }).validate());
  assert.equal(UpdateInternalServiceTermGroupRequestDto.parse({ title: 'New' }).validate().isRequired, undefined);
});
function synchronizeVersionChecks(em: AppEntityManager): AppEntityManager[] {
  let arrived = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  const writers = [em.fork(), em.fork()] as AppEntityManager[];
  for (const writer of writers) {
    const original = writer.findOne.bind(writer);
    writer.findOne = (async (...args: Parameters<typeof original>) => {
      const result = await original(...args);
      if (args[0] === Term && typeof args[1] === 'object' && args[1] !== null && 'version' in args[1]) {
        if (++arrived === 2) release();
        await gate;
      }
      return result;
    }) as typeof writer.findOne;
  }
  return writers;
}
const databaseUrl = process.env.SERVICE_TERMS_TEST_DATABASE_URL;
test('PostgreSQL: partial updates preserve values; concurrent creation/update and deleted versions conflict', { skip: !databaseUrl }, async () => {
  assert.match(new URL(databaseUrl!).pathname, /^\/service_terms_test_[a-z0-9_]+$/);
  const orm = await MikroORM.init({ entities: [...entities], entityManager: AppEntityManager, namingStrategy: EntityCaseNamingStrategy, clientUrl: databaseUrl, persistOnCreate: false });
  try {
    await orm.schema.create();
    const em = orm.em.fork() as AppEntityManager;
    const migration = new Migration20261012010000(orm.em.getDriver(), orm.config);
    migration.down(); for (const sql of migration.getQueries()) await em.execute(sql);
    migration.reset(); migration.up(); for (const sql of migration.getQueries()) await em.execute(sql);
    assert.equal((await orm.schema.getUpdateSchemaSQL()).trim(), '');
    const group = em.create(TermGroup, { title: 'Original', isRequired: false, sortOrder: 25 });
    em.persist(group); await em.flush();
    await new UpdateInternalServiceTermGroupHandler(em).execute(new UpdateInternalServiceTermGroupCommand({ groupId: group.id, dto: UpdateInternalServiceTermGroupRequestDto.parse({ title: 'Renamed' }).validate() }));
    await em.flush();
    const saved = await em.fork().findOneOrFail(TermGroup, group.id);
    assert.equal(saved.title, 'Renamed'); assert.equal(saved.isRequired, false); assert.equal(saved.sortOrder, 25);
    const input = CreateInternalServiceTermRequestDto.parse({ groupId: group.id, version: '1', content: 'Content', reason: 'Reason', summary: 'Summary', isNoticeRequired: false }).validate();
    const writers = synchronizeVersionChecks(em);
    const created = await Promise.allSettled(writers.map((writer) => new CreateInternalServiceTermHandler(writer).execute(new CreateInternalServiceTermCommand(input))));
    assert.equal(created.filter((r) => r.status === 'fulfilled').length, 1);
    const rejected = created.find((r) => r.status === 'rejected'); assert.ok(rejected?.status === 'rejected' && conflict(rejected.reason));
    const first = await em.findOneOrFail(Term, { termGroup: group.id, version: '1' });
    first.deletedAt = new Date(); await em.flush();
    await assert.rejects(() => new CreateInternalServiceTermHandler(em).execute(new CreateInternalServiceTermCommand(input)), conflict);
    const a = await new CreateInternalServiceTermHandler(em).execute(new CreateInternalServiceTermCommand(CreateInternalServiceTermRequestDto.parse({ ...input, version: '2', publishedAt: '2099-01-01T00:00:00Z', metadata: { options: { email: false } } }).validate()));
    const b = await new CreateInternalServiceTermHandler(em).execute(new CreateInternalServiceTermCommand(CreateInternalServiceTermRequestDto.parse({ ...input, version: '3' }).validate()));
    await new UpdateInternalServiceTermHandler(em).execute(new UpdateInternalServiceTermCommand({ termId: a.id, dto: UpdateInternalServiceTermRequestDto.parse({ summary: 'Changed' }).validate() }));
    const stored = await em.fork().findOneOrFail(Term, a.id);
    assert.equal(stored.content, 'Content'); assert.equal(stored.version, '2'); assert.equal(stored.summary, 'Changed'); assert.equal(stored.publishedAt?.getUTCFullYear(), 2099);
    await new UpdateInternalServiceTermHandler(em).execute(new UpdateInternalServiceTermCommand({ termId: a.id, dto: UpdateInternalServiceTermRequestDto.parse({ publishedAt: null, metadata: null }).validate() }));
    assert.equal((await em.fork().findOneOrFail(Term, a.id)).publishedAt, null);
    const updaters = synchronizeVersionChecks(em);
    const updated = await Promise.allSettled([a.id, b.id].map((termId, index) => new UpdateInternalServiceTermHandler(updaters[index]).execute(new UpdateInternalServiceTermCommand({ termId, dto: UpdateInternalServiceTermRequestDto.parse({ version: 'shared' }).validate() }))));
    assert.equal(updated.filter((r) => r.status === 'fulfilled').length, 1);
    const failedUpdate = updated.find((r) => r.status === 'rejected'); assert.ok(failedUpdate?.status === 'rejected' && conflict(failedUpdate.reason));
    assert.equal(await em.count(Term, { termGroup: group.id, version: 'shared' }), 1);
    const reader = em.fork() as AppEntityManager;
    const otherGroup = reader.create(TermGroup, { title: 'Other', isRequired: true, sortOrder: 0 });
    reader.persist(otherGroup);
    for (const [version, publishedAt, deletedAt, termGroup] of [
      ['old', new Date('2020-01-01'), null, group],
      ['new', new Date('2021-01-01'), null, group],
      ['scheduled', new Date('2099-01-01'), null, group],
      ['deleted', new Date('2022-01-01'), new Date(), group],
      ['other', new Date('2023-01-01'), null, otherGroup],
    ] as const) reader.persist(reader.create(Term, { termGroup, version, content: 'Content', reason: 'Reason', summary: 'Summary', isNoticeRequired: false, publishedAt, deletedAt }));
    await reader.flush();
    const handler = new GetTermRevisionsHandler(reader);
    const revisions = await handler.execute(new GetTermRevisionsQuery({ groupId: group.id, dto: Object.assign(new GetTermRevisionsRequestDto(), { page: 1, limit: 1 }) }));
    assert.equal(revisions.totalCount, 2);
    assert.deepEqual(revisions.items.map(item => item.version), ['new']);
    const next = await handler.execute(new GetTermRevisionsQuery({ groupId: group.id, dto: Object.assign(new GetTermRevisionsRequestDto(), { page: 2, limit: 1 }) }));
    assert.deepEqual(next.items.map(item => item.version), ['old']);

  }
  finally { await orm.close(true); }
});
