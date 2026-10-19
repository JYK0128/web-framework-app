import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Notice } from '../src/core/database/entities/notices';
import { NoticeImportance } from '@pkg/shared/constants';
import { Event, EventPhase } from '../src/core/database/entities/events';
import { Faq, FaqCategory } from '../src/core/database/entities/faqs';
import type { AppEntityManager } from '../src/core/database/entity-manager';
import { UpdateNoticeRequestDto } from '#/modules/notice/update-notice.request.dto';
import { UpdateNoticeCommand } from '#/modules/notice/update-notice.command';
import { UpdateNoticeHandler } from '#/modules/notice/update-notice.handler';
import { UpdateEventRequestDto } from '#/modules/event/update-event.request.dto';
import { UpdateEventCommand } from '#/modules/event/update-event.command';
import { UpdateEventHandler } from '#/modules/event/update-event.handler';
import { UpdateFaqRequestDto } from '#/modules/faq/update-faq.request.dto';
import { UpdateFaqCommand } from '#/modules/faq/update-faq.command';
import { UpdateFaqHandler } from '#/modules/faq/update-faq.handler';

const manager = (entity: object) => ({ findOne: async () => entity }) as unknown as AppEntityManager;
const publishedAt = new Date('2020-01-01T00:00:00Z');
test('notice title-only updates preserve publication, pinned state and importance', async () => {
  const notice = Object.assign(new Notice(), { id: 'notice', title: 'Old', content: 'Content', importance: NoticeImportance.IMPORTANT, isPinned: true, publishedAt });
  const input = plainToInstance(UpdateNoticeRequestDto, { title: 'New' });
  assert.deepEqual(validateSync(input), []);
  assert.equal(input.publishedAt, undefined); assert.equal(input.isPinned, undefined); assert.equal(input.importance, undefined);
  await new UpdateNoticeHandler(manager(notice)).execute(new UpdateNoticeCommand(notice.id, input));
  assert.equal(notice.title, 'New'); assert.equal(notice.isPinned, true); assert.equal(notice.importance, NoticeImportance.IMPORTANT); assert.equal(notice.publishedAt, publishedAt);
  await new UpdateNoticeHandler(manager(notice)).execute(new UpdateNoticeCommand(notice.id, plainToInstance(UpdateNoticeRequestDto, { isPinned: false, publishedAt: null })));
  assert.equal(notice.isPinned, false); assert.equal(notice.publishedAt, null);
});
test('event title-only updates preserve publication and dates; nullable links can be cleared', async () => {
  const startsAt = new Date('2030-01-01'); const endsAt = new Date('2030-01-02');
  const event = Object.assign(new Event(), { id: 'event', title: 'Old', content: 'Content', publishedAt, startsAt, endsAt, imageUrl: 'http://example.com/image', linkUrl: 'http://example.com' });
  const handler = new UpdateEventHandler(manager(event));
  await handler.execute(new UpdateEventCommand(event.id, plainToInstance(UpdateEventRequestDto, { title: 'New' })));
  assert.equal(event.title, 'New'); assert.equal(event.isPublished, true); assert.equal(event.publishedAt, publishedAt); assert.equal(event.startsAt, startsAt); assert.equal(event.endsAt, endsAt);
  const clear = plainToInstance(UpdateEventRequestDto, { imageUrl: null, linkUrl: null });
  assert.deepEqual(validateSync(clear), []);
  await handler.execute(new UpdateEventCommand(event.id, clear));
  assert.equal(event.imageUrl, null); assert.equal(event.linkUrl, null);
});
test('FAQ question-only updates preserve hidden state and sort order; false and zero remain valid', async () => {
  const faq = Object.assign(new Faq(), { id: 'faq', category: Object.values(FaqCategory)[0], question: 'Old', answer: 'Answer', isPublished: false, sortOrder: 25 });
  const handler = new UpdateFaqHandler(manager(faq));
  await handler.execute(new UpdateFaqCommand({ faqId: faq.id, dto: plainToInstance(UpdateFaqRequestDto, { question: 'New' }) }));
  assert.equal(faq.question, 'New'); assert.equal(faq.isPublished, false); assert.equal(faq.sortOrder, 25);
  const input = plainToInstance(UpdateFaqRequestDto, { sortOrder: 0, isPublished: false });
  assert.deepEqual(validateSync(input), []);
  await handler.execute(new UpdateFaqCommand({ faqId: faq.id, dto: input }));
  assert.equal(faq.sortOrder, 0); assert.equal(faq.isPublished, false);
});
test('partial content requests reject null for non-nullable fields', () => {
  for (const [Dto, fields] of [
    [UpdateNoticeRequestDto, ['title', 'content', 'importance', 'isPinned']],
    [UpdateEventRequestDto, ['title', 'content', 'startsAt', 'endsAt']],
    [UpdateFaqRequestDto, ['category', 'question', 'answer', 'sortOrder', 'isPublished']],
  ] as const) {
    for (const field of fields) assert.ok(validateSync(plainToInstance(Dto as new () => object, { [field]: null })).length > 0, `${Dto.name}.${field}`);
  }
});

test('Q&A, support and membership updates reject invalid nulls and permission strings', async () => {
  const { UpdateQnaRequestDto } = await import('#/modules/qna/update-qna.request.dto');
const { UpdateOwnQnaRequestDto } = await import('#/modules/qna/update-own-qna.request.dto');
  const { UpdateSupportRoomRequestDto } = await import('#/modules/support/room/update-support-room.request.dto');
  const { UpdateCustomerMembershipRequestDto } = await import('#/modules/membership/update-customer-membership.request.dto');
const { CreateCustomerMembershipRequestDto } = await import('#/modules/membership/create-customer-membership.request.dto');
  for (const [Dto, fields] of [
    [UpdateQnaRequestDto, ['status', 'priority', 'answer']],
    [UpdateOwnQnaRequestDto, ['status']],
    [UpdateSupportRoomRequestDto, ['status']],
    [UpdateCustomerMembershipRequestDto, ['label', 'description', 'permissions']],
  ] as const) {
    assert.deepEqual(validateSync(plainToInstance(Dto as new () => object, {})), []);
    for (const field of fields) assert.ok(validateSync(plainToInstance(Dto as new () => object, { [field]: null })).length > 0, `${Dto.name}.${field}`);
  }
  assert.deepEqual(validateSync(plainToInstance(UpdateQnaRequestDto, { assigneeId: null })), []);
  assert.ok(validateSync(plainToInstance(UpdateCustomerMembershipRequestDto, { permissions: 'read' })).length > 0);
  assert.deepEqual(validateSync(plainToInstance(UpdateCustomerMembershipRequestDto, { permissions: [] })), []);
  assert.ok(validateSync(plainToInstance(CreateCustomerMembershipRequestDto, { code: 'vip', label: 'VIP', permissions: 'read' })).length > 0);
});

test('notice detail requests retain public visibility and delete requests retain soft deletion', async () => {
  const { GetNoticeRequestDto } = await import('#/modules/notice/get-notice.request.dto');
  const { DeleteNoticeRequestDto } = await import('#/modules/notice/delete-notice.request.dto');
  const { GetNoticeQuery } = await import('#/modules/notice/get-notice.query');
const { DeleteNoticeCommand } = await import('#/modules/notice/delete-notice.command');
  const { GetNoticeHandler } = await import('#/modules/notice/get-notice.handler');
const { DeleteNoticeHandler } = await import('#/modules/notice/delete-notice.handler');
  const notice = Object.assign(new Notice(), { id: 'notice', title: 'Draft', content: 'Content', publishedAt: null });
  const em = { findOne: async (_entity: unknown, where: { id: string, publishedAt?: { $lte: Date } }) => where.id === notice.id && (!where.publishedAt || (notice.publishedAt !== null && notice.publishedAt <= where.publishedAt.$lte)) ? notice : null } as unknown as AppEntityManager;
  const request = GetNoticeRequestDto.parse({ noticeId: notice.id }).validate();
  const handler = new GetNoticeHandler(em);
  await assert.rejects(() => handler.execute(new GetNoticeQuery(request, true)), (error: unknown) => (error as { code?: string }).code === 'NOTICE_NOT_FOUND');
  assert.equal((await handler.execute(new GetNoticeQuery(request, false))).title, 'Draft');
  notice.publishedAt = new Date('2099-01-01T00:00:00Z');
  await assert.rejects(() => handler.execute(new GetNoticeQuery(request, true)), (error: unknown) => (error as { code?: string }).code === 'NOTICE_NOT_FOUND');
  notice.publishedAt = new Date('2020-01-01T00:00:00Z');
  assert.equal((await handler.execute(new GetNoticeQuery(request, true))).title, 'Draft');
  const remove = new DeleteNoticeCommand(DeleteNoticeRequestDto.parse({ noticeId: notice.id }).validate());
  assert.deepEqual(await new DeleteNoticeHandler(em).execute(remove), { ok: true });
  assert.ok(notice.deletedAt instanceof Date);
  await assert.rejects(() => new DeleteNoticeHandler(em).execute(remove), (error: unknown) => (error as { code?: string }).code === 'NOTICE_NOT_FOUND');
});

test('event detail requests retain public visibility and delete requests retain soft deletion', async () => {
  const { GetEventRequestDto } = await import('#/modules/event/get-event.request.dto');
  const { DeleteEventRequestDto } = await import('#/modules/event/delete-event.request.dto');
  const { GetEventQuery } = await import('#/modules/event/get-event.query');
const { DeleteEventCommand } = await import('#/modules/event/delete-event.command');
  const { GetEventHandler } = await import('#/modules/event/get-event.handler');
const { DeleteEventHandler } = await import('#/modules/event/delete-event.handler');
  const event = Object.assign(new Event(), { id: 'event', title: 'Draft', content: 'Content', startsAt: new Date('2030-01-01'), endsAt: new Date('2030-01-02') });
  const em = { findOne: async (_entity: unknown, where: { id: string, publishedAt?: { $lte: Date } }) => where.id === event.id && (!where.publishedAt || (event.publishedAt !== null && event.publishedAt <= where.publishedAt.$lte)) ? event : null } as unknown as AppEntityManager;
  const request = GetEventRequestDto.parse({ eventId: event.id }).validate();
  const handler = new GetEventHandler(em);
  await assert.rejects(() => handler.execute(new GetEventQuery(request, true)), (error: unknown) => (error as { code?: string }).code === 'EVENT_NOT_FOUND');
  assert.equal((await handler.execute(new GetEventQuery(request, false))).title, 'Draft');
  const remove = new DeleteEventCommand(DeleteEventRequestDto.parse({ eventId: event.id }).validate());
  assert.deepEqual(await new DeleteEventHandler(em).execute(remove), { ok: true });
  assert.ok(event.deletedAt instanceof Date);
  await assert.rejects(() => new DeleteEventHandler(em).execute(remove), (error: unknown) => (error as { code?: string }).code === 'EVENT_NOT_FOUND');
});


test('notice publication dates accept drafts and schedules; invalid dates are rejected', async () => {
  const { CreateNoticeRequestDto } = await import('#/modules/notice/create-notice.request.dto');
  const { CreateNoticeCommand } = await import('#/modules/notice/create-notice.command');
  const { CreateNoticeHandler } = await import('#/modules/notice/create-notice.handler');
  for (const date of [undefined, null, '2099-01-01T12:00:00+09:00', '2020-01-01T00:00:00Z']) {
    const input = plainToInstance(CreateNoticeRequestDto, { title: 'Notice', content: 'Content', publishedAt: date });
    assert.deepEqual(validateSync(input), []);
    let saved: Notice | undefined;
    const em = {
      create: (_entity: unknown, values: object) => Object.assign(new Notice(), { id: 'notice' }, values),
      persist: (notice: Notice) => { saved = notice; },
    } as unknown as AppEntityManager;
    const result = await new CreateNoticeHandler(em).execute(new CreateNoticeCommand(input));
    assert.equal(saved?.publishedAt?.toISOString() ?? null, date ? new Date(date).toISOString() : null);
    assert.equal(result.publishedAt?.toISOString() ?? null, saved?.publishedAt?.toISOString() ?? null);
    assert.equal('status' in result, false);
  }
  for (const Dto of [CreateNoticeRequestDto, UpdateNoticeRequestDto]) {
    assert.ok(validateSync(plainToInstance(Dto, { title: 'Notice', content: 'Content', publishedAt: 'invalid-date' })).length > 0);
  }
  assert.deepEqual(validateSync(plainToInstance(UpdateNoticeRequestDto, { publishedAt: null })), []);
});

test('scheduled notices become public at their publication time without a status update', async (context) => {
  const { GetPublicNoticesRequestDto } = await import('#/modules/notice/get-public-notices.request.dto');
  const { GetPublicNoticesQuery } = await import('#/modules/notice/get-public-notices.query');
  const { GetPublicNoticesHandler } = await import('#/modules/notice/get-public-notices.handler');
  context.mock.timers.enable({ apis: ['Date'], now: new Date('2030-01-01T00:00:00Z') });
  const scheduled = Object.assign(new Notice(), { id: 'scheduled', title: 'Scheduled', content: 'Content', publishedAt: new Date('2030-01-01T01:00:00Z') });
  const draft = Object.assign(new Notice(), { id: 'draft', title: 'Draft', content: 'Content', publishedAt: null });
  const published = Object.assign(new Notice(), { id: 'published', title: 'Published', content: 'Content', publishedAt: new Date('2029-12-31T23:00:00Z') });
  const em = { findByCursor: async (_entity: unknown, options: { where: { $and: { publishedAt?: { $ne: null, $lte: Date } }[] } }) => {
    const condition = options.where.$and.find((filter) => filter.publishedAt)?.publishedAt;
    assert.ok(condition); assert.equal(condition.$ne, null);
    const items = [draft, scheduled, published].filter((notice) => notice.publishedAt !== null && notice.publishedAt <= condition.$lte);
    return { items, totalCount: items.length, hasNextPage: false, hasPrevPage: false, startCursor: null, endCursor: null };
  } } as unknown as AppEntityManager;
  const handler = new GetPublicNoticesHandler(em);
  const query = new GetPublicNoticesQuery(plainToInstance(GetPublicNoticesRequestDto, {}));
  assert.deepEqual((await handler.execute(query)).items.map((notice) => notice.id), ['published']);
  context.mock.timers.setTime(new Date('2030-01-01T01:00:00Z').getTime());
  assert.deepEqual((await handler.execute(query)).items.map((notice) => notice.id), ['scheduled', 'published']);
  assert.equal('status' in scheduled, false);
});


const noticeDatabaseUrl = process.env.NOTICE_TEST_DATABASE_URL;
test('PostgreSQL: notice migration preserves publication and scheduled visibility follows persisted dates', { skip: !noticeDatabaseUrl }, async () => {
  assert.match(new URL(noticeDatabaseUrl!).pathname, /^\/notice_publication_test_[a-z0-9_]+$/);
  const { MikroORM } = await import('@mikro-orm/postgresql');
  const { EntityCaseNamingStrategy } = await import('@mikro-orm/core');
  const { AppEntityManager: EntityManager } = await import('../src/core/database/entity-manager');
  const { Migration20261013010000 } = await import('../src/core/database/migrations/Migration20261013010000_notice-publication-date');
  const { CreateNoticeRequestDto } = await import('#/modules/notice/create-notice.request.dto');
  const { CreateNoticeCommand } = await import('#/modules/notice/create-notice.command');
  const { CreateNoticeHandler } = await import('#/modules/notice/create-notice.handler');
  const { GetPublicNoticesRequestDto } = await import('#/modules/notice/get-public-notices.request.dto');
  const { GetPublicNoticesQuery } = await import('#/modules/notice/get-public-notices.query');
  const { GetPublicNoticesHandler } = await import('#/modules/notice/get-public-notices.handler');
  const { GetNoticeRequestDto } = await import('#/modules/notice/get-notice.request.dto');
  const { GetNoticeQuery } = await import('#/modules/notice/get-notice.query');
  const { GetNoticeHandler } = await import('#/modules/notice/get-notice.handler');
  const orm = await MikroORM.init({ entities: [Notice, Event], entityManager: EntityManager, namingStrategy: EntityCaseNamingStrategy, clientUrl: noticeDatabaseUrl, persistOnCreate: false });
  try {
    await orm.schema.create();
    const em = orm.em.fork() as AppEntityManager;
    const { Migration20261013020000 } = await import('../src/core/database/migrations/Migration20261013020000_event-publication-date');
    const legacyEvents = [null, publishedAt, null].map((date, index) => em.create(Event, { title: `Legacy event ${index}`, content: 'Content', startsAt: publishedAt, endsAt: new Date('2099-01-01'), publishedAt: date }));
    em.persist(legacyEvents); await em.flush();
    await em.execute(`alter table "event" add column "status" text not null default 'draft'`);
    await em.execute(`alter table "event" add constraint "event_status_check" check ("status" in ('draft', 'published'))`);
    await em.execute(`update "event" set "status" = 'published' where "id" in (?, ?)`, [legacyEvents[1].id, legacyEvents[2].id]);
    await em.execute('drop index "event_publishedAt_index"');
    await em.execute('create index "event_status_startsAt_index" on "event" ("status", "startsAt")');
    const eventMigration = new Migration20261013020000(orm.em.getDriver(), orm.config);
    eventMigration.up(); for (const sql of eventMigration.getQueries()) await em.execute(sql);
    em.clear();
    assert.equal((await em.findOneOrFail(Event, legacyEvents[0].id)).publishedAt, null);
    assert.equal((await em.findOneOrFail(Event, legacyEvents[1].id)).publishedAt?.toISOString(), publishedAt.toISOString());
    assert.ok((await em.findOneOrFail(Event, legacyEvents[2].id)).publishedAt instanceof Date);
    eventMigration.reset(); eventMigration.down(); for (const sql of eventMigration.getQueries()) await em.execute(sql);
    eventMigration.reset(); eventMigration.up(); for (const sql of eventMigration.getQueries()) await em.execute(sql);
    assert.equal((await orm.schema.getUpdateSchemaSQL()).trim(), '');

    const draft = em.create(Notice, { title: 'Legacy draft', content: 'Content', publishedAt });
    const published = em.create(Notice, { title: 'Legacy published', content: 'Content', publishedAt });
    const undated = em.create(Notice, { title: 'Legacy undated', content: 'Content', publishedAt: null });
    em.persist([draft, published, undated]); await em.flush();
    await em.execute(`alter table "notice" add column "status" text not null default 'draft'`);
    await em.execute(`update "notice" set "status" = 'published' where "id" in (?, ?)`, [published.id, undated.id]);
    await em.execute('drop index "notice_publishedAt_index"');
    await em.execute('create index "notice_status_publishedAt_index" on "notice" ("status", "publishedAt")');
    const migration = new Migration20261013010000(orm.em.getDriver(), orm.config);
    migration.up(); for (const sql of migration.getQueries()) await em.execute(sql);
    em.clear();
    assert.equal((await em.findOneOrFail(Notice, draft.id)).publishedAt, null);
    assert.equal((await em.findOneOrFail(Notice, published.id)).publishedAt?.toISOString(), publishedAt.toISOString());
    assert.ok((await em.findOneOrFail(Notice, undated.id)).publishedAt instanceof Date);
    assert.equal((await orm.schema.getUpdateSchemaSQL()).trim(), '');
    const created = await new CreateNoticeHandler(em).execute(new CreateNoticeCommand(plainToInstance(CreateNoticeRequestDto, { title: 'Scheduled', content: 'Content', publishedAt: '2099-01-01T00:00:00Z' })));
    await em.flush(); em.clear();
    const request = GetNoticeRequestDto.parse({ noticeId: created.id }).validate();
    const detail = new GetNoticeHandler(em);
    await assert.rejects(() => detail.execute(new GetNoticeQuery(request, true)), (error: unknown) => (error as { code?: string }).code === 'NOTICE_NOT_FOUND');
    const list = new GetPublicNoticesHandler(em);
    const query = new GetPublicNoticesQuery(plainToInstance(GetPublicNoticesRequestDto, {}));
    assert.ok(!(await list.execute(query)).items.some((item) => item.id === created.id || item.id === draft.id));
    await new UpdateNoticeHandler(em).execute(new UpdateNoticeCommand(created.id, plainToInstance(UpdateNoticeRequestDto, { publishedAt })));
    await em.flush(); em.clear();
    assert.equal((await detail.execute(new GetNoticeQuery(request, true))).id, created.id);
    assert.ok((await list.execute(query)).items.some((item) => item.id === created.id));
    await new UpdateNoticeHandler(em).execute(new UpdateNoticeCommand(created.id, plainToInstance(UpdateNoticeRequestDto, { publishedAt: null })));
    await em.flush(); em.clear();
    assert.equal((await em.findOneOrFail(Notice, created.id)).publishedAt, null);
    await assert.rejects(() => detail.execute(new GetNoticeQuery(request, true)), (error: unknown) => (error as { code?: string }).code === 'NOTICE_NOT_FOUND');
    migration.reset(); migration.down(); for (const sql of migration.getQueries()) await em.execute(sql);
    migration.reset(); migration.up(); for (const sql of migration.getQueries()) await em.execute(sql);
    assert.equal((await orm.schema.getUpdateSchemaSQL()).trim(), '');
  } finally { await orm.close(true); }
});


test('notice getters and response mapping derive publication at the exact scheduled time', async (context) => {
  const { NoticeItemDto } = await import('#/modules/notice/notice-item.dto');
  const now = new Date('2030-01-01T00:00:00Z');
  context.mock.timers.enable({ apis: ['Date'], now });
  const notice = Object.assign(new Notice(), { id: 'notice', title: 'Title', content: 'Content' });
  const state = () => {
    const dto = NoticeItemDto.parseEntity(notice);
    return [dto.isDraft, dto.isScheduled, dto.isPublished];
  };
  assert.deepEqual(state(), [true, false, false]);
  notice.publishedAt = new Date(now.getTime() + 1000);
  assert.deepEqual(state(), [false, true, false]);
  context.mock.timers.tick(1000);
  assert.deepEqual(state(), [false, false, true]);
  context.mock.timers.tick(1000);
  assert.deepEqual(state(), [false, false, true]);
  notice.publishedAt = null;
  assert.deepEqual(state(), [true, false, false]);
});

test('event publication and phase getters change at exact publication, start and end times', async (context) => {
  const { EventItemDto } = await import('#/modules/event/event-item.dto');
  const now = new Date('2030-01-01T00:00:00Z');
  context.mock.timers.enable({ apis: ['Date'], now });
  const event = Object.assign(new Event(), { id: 'event', title: 'Title', content: 'Content', startsAt: new Date(now.getTime() + 2000), endsAt: new Date(now.getTime() + 3000) });
  const state = () => { const dto = EventItemDto.parseEntity(event); return [dto.isDraft, dto.isScheduled, dto.isPublished, dto.phase]; };
  assert.deepEqual(state(), [true, false, false, EventPhase.upcoming]);
  event.publishedAt = new Date(now.getTime() + 1000);
  assert.deepEqual(state(), [false, true, false, EventPhase.upcoming]);
  const { GetEventHandler } = await import('#/modules/event/get-event.handler');
  const { GetEventQuery } = await import('#/modules/event/get-event.query');
  const { GetEventRequestDto } = await import('#/modules/event/get-event.request.dto');
  const em = { findOne: async (_entity: unknown, where: { publishedAt?: { $lte: Date } }) => !where.publishedAt || (event.publishedAt && event.publishedAt <= where.publishedAt.$lte) ? event : null } as unknown as AppEntityManager;
  const detail = new GetEventHandler(em);
  const query = new GetEventQuery(GetEventRequestDto.parse({ eventId: event.id }), true);
  await assert.rejects(() => detail.execute(query), (error: unknown) => (error as { code?: string }).code === 'EVENT_NOT_FOUND');

  context.mock.timers.tick(1000);
  assert.deepEqual(state(), [false, false, true, EventPhase.upcoming]);
  assert.equal((await detail.execute(query)).id, event.id);
  context.mock.timers.tick(1000);
  assert.deepEqual(state(), [false, false, true, EventPhase.ongoing]);
  context.mock.timers.tick(1000);
  assert.deepEqual(state(), [false, false, true, EventPhase.ended]);
  await new UpdateEventHandler(manager(event)).execute(new UpdateEventCommand(event.id, plainToInstance(UpdateEventRequestDto, { publishedAt: null })));
  assert.deepEqual(state(), [true, false, false, EventPhase.ended]);
});

test('terms distinguish drafts, schedules and published documents at the publication boundary', async (context) => {
  const { Term } = await import('../src/core/database/entities/terms');
  const now = new Date('2030-01-01T00:00:00Z');
  context.mock.timers.enable({ apis: ['Date'], now });
  const term = new Term();
  const state = () => [term.isDraft, term.isScheduled, term.isPublished];
  assert.deepEqual(state(), [true, false, false]);
  term.publishedAt = new Date(now.getTime() + 1000);
  assert.deepEqual(state(), [false, true, false]);
  context.mock.timers.tick(1000);
  assert.deepEqual(state(), [false, false, true]);
});
