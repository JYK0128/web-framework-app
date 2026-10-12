import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EntityCaseNamingStrategy } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { ApplicationError } from '@pkg/shared/common';
import { entities } from '../src/entities.generated';
import { Term, TermGroup, UserTermAgreement } from '../src/core/database/entities/terms';
import { User } from '../src/core/database/entities/auth/user.entity';
import { AppEntityManager } from '../src/core/database/entity-manager';
import type { PrincipalContext } from '../src/core/http/contexts/principal.context';
import { TrimStringPipe } from '../src/core/http/pipes/trim-string.pipe';
import { UpdateTermRequestDto } from '../src/modules/terms/documents/update-term.request.dto';
import { CreateTermGroupRequestDto } from '../src/modules/terms/groups/create-term-group.request.dto';
import { UpdateTermGroupRequestDto } from '../src/modules/terms/groups/update-term-group.request.dto';
import { CreateTermRequestDto } from '../src/modules/terms/documents/create-term.request.dto';
import { GetAgreementsRequestDto } from '../src/modules/terms/agreements/get-agreements.request.dto';
import { CreateTermCommand } from '../src/modules/terms/documents/create-term.command';
import { CreateTermHandler } from '../src/modules/terms/documents/create-term.handler';
import { UpdateTermCommand } from '../src/modules/terms/documents/update-term.command';
import { UpdateTermHandler } from '../src/modules/terms/documents/update-term.handler';
import { GetAgreementsHandler } from '../src/modules/terms/agreements/get-agreements.handler';
import { GetAgreementsQuery } from '../src/modules/terms/agreements/get-agreements.query';
import { Migration20261012000000 } from '../src/core/database/migrations/Migration20261012000000_term-version-uniqueness';

const invalid = (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR' && error.status === 400;
const conflict = (error: unknown) => error instanceof ApplicationError && error.code === 'TERM_VERSION_ALREADY_EXISTS' && error.status === 409;

test('updates reject null and empty versions, preserve omission and nullable fields', () => {
  for (const field of ['version', 'content', 'reason', 'summary', 'isNoticeRequired']) {
    assert.throws(() => UpdateTermRequestDto.parse({ [field]: null }).validate(), invalid);
  }
  for (const version of ['', '   ']) {
    assert.throws(() => UpdateTermRequestDto.parse(new TrimStringPipe().transform({ version })).validate(), invalid);
  }
  assert.doesNotThrow(() => UpdateTermRequestDto.parse({}).validate());
  assert.doesNotThrow(() => UpdateTermRequestDto.parse({ publishedAt: null, metadata: null, isNoticeRequired: false }).validate());
});
test('group inputs reject null and preserve false/zero and omitted defaults', () => {
  for (const Dto of [CreateTermGroupRequestDto, UpdateTermGroupRequestDto]) {
    for (const field of ['title', 'isRequired', 'sortOrder']) {
      assert.throws(() => Dto.parse({ title: 'Group', [field]: null }).validate(), invalid);
    }
    assert.doesNotThrow(() => Dto.parse({ title: 'Group', isRequired: false, sortOrder: 0 }).validate());
  }
  assert.doesNotThrow(() => UpdateTermGroupRequestDto.parse({}).validate());
  assert.doesNotThrow(() => CreateTermGroupRequestDto.parse({ title: 'Group' }).validate());
});

function synchronizeVersionChecks(em: AppEntityManager): AppEntityManager[] {
  let arrived = 0;
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => { release = resolve; });
  const writers = [em.fork(), em.fork()] as AppEntityManager[];
  for (const writer of writers) {
    const original = writer.findOne.bind(writer);
    writer.findOne = (async (...args: Parameters<typeof original>) => {
      const result = await original(...args);
      if (args[0] === Term && typeof args[1] === 'object' && args[1] !== null && 'version' in args[1]) {
        if (++arrived === 2) release();
        await barrier;
      }
      return result;
    }) as typeof writer.findOne;
  }
  return writers;
}

const databaseUrl = process.env.TERMS_TEST_DATABASE_URL;
test('PostgreSQL: migration, concurrent creation, version reuse and latest agreements', { skip: !databaseUrl }, async () => {
  assert.match(new URL(databaseUrl!).pathname, /^\/terms_test_[a-z0-9_]+$/, 'requires a disposable test database');
  const orm = await MikroORM.init({ entities: [...entities], entityManager: AppEntityManager, namingStrategy: EntityCaseNamingStrategy, clientUrl: databaseUrl });
  try {
    await orm.schema.create();
    const em = orm.em.fork() as AppEntityManager;
    const migration = new Migration20261012000000(orm.em.getDriver(), orm.config);
    migration.down();
    for (const sql of migration.getQueries()) await em.execute(sql);
    migration.reset(); migration.up();
    for (const sql of migration.getQueries()) await em.execute(sql);
    assert.equal((await orm.schema.getUpdateSchemaSQL()).trim(), '');
    const group = em.create(TermGroup, { title: 'Terms' });
    const user = em.create(User, {});
    em.persist([group, user]);
    await em.flush();
    const input = { termGroupId: group.id, version: '1', content: 'Content', reason: 'Reason', summary: 'Summary', isNoticeRequired: false };
    const writers = synchronizeVersionChecks(em);
    const results = await Promise.allSettled(writers.map((writer) => new CreateTermHandler(writer).execute(new CreateTermCommand(CreateTermRequestDto.parse(input).validate()))));
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    const failed = results.find((result) => result.status === 'rejected');
    assert.ok(failed?.status === 'rejected' && conflict(failed.reason));
    assert.equal(await em.count(Term, { termGroup: group.id, version: '1' }), 1);
    const first = await em.findOneOrFail(Term, { termGroup: group.id, version: '1' });
    first.deletedAt = new Date(); await em.flush();
    await new CreateTermHandler(em).execute(new CreateTermCommand(CreateTermRequestDto.parse(input).validate()));
    assert.equal(await em.count(Term, { termGroup: group.id, version: '1' }, { filters: false }), 2);
    const other = await new CreateTermHandler(em).execute(new CreateTermCommand(CreateTermRequestDto.parse({ ...input, version: '2' }).validate()));
    await assert.rejects(() => new UpdateTermHandler(em).execute(new UpdateTermCommand({ termId: other.id, data: UpdateTermRequestDto.parse({ version: '1' }) })), conflict);
    const updated = await new UpdateTermHandler(em).execute(new UpdateTermCommand({ termId: other.id, data: UpdateTermRequestDto.parse({ version: '3', publishedAt: null, metadata: null }) }));
    assert.equal(updated.version, '3'); assert.equal(updated.publishedAt, null);
    const activeFirst = await em.findOneOrFail(Term, { termGroup: group.id, version: '1' });
    const updaters = synchronizeVersionChecks(em);
    const updateResults = await Promise.allSettled([activeFirst.id, other.id].map((termId, index) =>
      new UpdateTermHandler(updaters[index]).execute(new UpdateTermCommand({ termId, data: UpdateTermRequestDto.parse({ version: 'shared' }).validate() })),
    ));
    assert.equal(updateResults.filter((result) => result.status === 'fulfilled').length, 1);
    const failedUpdate = updateResults.find((result) => result.status === 'rejected');
    assert.ok(failedUpdate?.status === 'rejected' && conflict(failedUpdate.reason));
    assert.equal(await em.count(Term, { termGroup: group.id, version: 'shared' }), 1);
    const when = new Date('2020-01-01T00:00:00Z');
    const old = em.create(Term, { termGroup: group, version: 'old', content: 'C', reason: 'R', summary: 'S', isNoticeRequired: false, id: 'term-a', publishedAt: when });
    const latest = em.create(Term, { termGroup: group, version: 'latest', content: 'C', reason: 'R', summary: 'S', isNoticeRequired: false, id: 'term-b', publishedAt: when });
    const removed = em.create(Term, { termGroup: group, version: 'removed', content: 'C', reason: 'R', summary: 'S', isNoticeRequired: false, publishedAt: new Date('2021-01-01'), deletedAt: new Date() });
    const hiddenGroup = em.create(TermGroup, { title: 'Deleted', deletedAt: new Date() });
    const hiddenTerm = em.create(Term, { termGroup: hiddenGroup, version: 'hidden', content: 'C', reason: 'R', summary: 'S', isNoticeRequired: false, publishedAt: when });
    em.persist([old, latest, removed, hiddenGroup, hiddenTerm]);
    em.persist([
      em.create(UserTermAgreement, { user, term: old, isAgreed: true, id: 'agreement-a', createdAt: when }),
      em.create(UserTermAgreement, { user, term: latest, isAgreed: false, id: 'agreement-b', createdAt: when, metadata: { options: { email: false } } }),
      em.create(UserTermAgreement, { user, term: latest, isAgreed: true, createdAt: new Date('2022-01-01'), deletedAt: new Date() }),
      em.create(UserTermAgreement, { user, term: removed, isAgreed: true, createdAt: new Date('2023-01-01') }),
    ]);
    await em.flush();
    const principal = { ensureUser: () => user } as unknown as PrincipalContext;
    const result = await new GetAgreementsHandler(em, principal).execute(new GetAgreementsQuery(GetAgreementsRequestDto.parse({})));
    assert.equal(result.items.length, 1); assert.equal(result.items[0].termId, latest.id);
    assert.equal(result.items[0].isAgreed, false);
    assert.deepEqual(result.items[0].agreementMetadata, { options: { email: false } });
  }
  finally { await orm.close(true); }
});
