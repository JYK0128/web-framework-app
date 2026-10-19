import { Qna } from '../src/core/database/entities/qna';
import { GetOwnQnasQuery } from '../src/modules/qna/get-own-qnas.query';
import { GetQnasRequestDto } from '../src/modules/qna/get-qnas.request.dto';
import { UpdateQnaCommand } from '../src/modules/qna/update-qna.command';
import { CreateSupportMessageCommand } from '../src/modules/support/messages/create-support-message.command';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Global, Module, ValidationPipe, type ModuleMetadata } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { CommandBus, QueryBus, EventBus } from '@nestjs/cqrs';
import { ScheduleModule, SchedulerRegistry } from '@nestjs/schedule';
import { QnaStatus, ServiceSystemConfigCode } from '@pkg/shared/constants';
import { USER_AUTH_SERVICE } from '../src/core/auth/user/user-auth.interface';
import { TokenStore } from '@pkg/server-core/auth/user/token/stores/token.store';
import { SystemConfig } from '../src/core/database/entities/system-configs';
import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '../src/core/database/entities/support';
import { AppEntityManager } from '../src/core/database/entity-manager';
import { StorageService } from '../src/core/file-storage/storage.service';
import { EventBroker } from '../src/core/event-broker/event-broker.service';
import { EVENT_BROKER } from '../src/core/event-broker/event-broker.interface';
import { PrincipalContext } from '../src/core/http/contexts/principal.context';
import { KvStore } from '../src/core/kv-store/kv-store.service';
import { NotificationService } from '../src/core/notification';
import { RealtimeService } from '../src/core/realtime/realtime.service';
import { DomainModule } from '../src/modules/domain.module';
import { CustomersModule } from '../src/modules/customers/customers.module';
import { InternalCustomerSessionsController } from '../src/modules/customers/sessions/sessions.controller';
import { MembershipsModule } from '../src/modules/memberships/memberships.module';
import { ServiceTermsModule } from '../src/modules/service-terms/service-terms.module';
import { SupportModule } from '../src/modules/support/support.module';
import { GetOwnSupportRoomQuery } from '../src/modules/support/rooms/get-own-support-room.query';
import { GetSupportRoomQuery } from '../src/modules/support/rooms/get-support-room.query';
import { GetOwnSupportMessagesQuery } from '../src/modules/support/messages/get-own-support-messages.query';
import { CreateOwnSupportMessageCommand } from '../src/modules/support/messages/create-own-support-message.command';
import { UpdateOwnSupportRoomCommand } from '../src/modules/support/rooms/update-own-support-room.command';
import { SupportRoomCreatedEvent } from '../src/modules/support/rooms/support-room-created.event';
import { QnaModule } from '../src/modules/qna/qna.module';
import { FaqsModule } from '../src/modules/faqs/faqs.module';
import { EventsModule } from '../src/modules/events/events.module';
import { NoticesModule } from '../src/modules/notices/notices.module';

const snapshot = {
  operation: { hours: { start: '09:00', end: '18:00', openDays: [1,2,3,4,5], lunchBreak: { enabled: false, start: '12:00', end: '13:00' } }, holidays: [], messages: { lunch: '', offHours: '', holiday: '' } },
  maintenance: { temporary: { enabled: false, message: '', startAt: null, endAt: null }, recurring: { enabled: false, message: '', daysOfWeek: [], startTime: '01:00', endTime: '02:00' } },
  inquiry: { customerGreeting: 'Hello', offlineReplyMessage: 'Offline', unansweredThresholdMinutes: 10, autoCloseHours: 24 },
  webhook: { enabled: true, type: 'SLACK', cooldownMinutes: 1, webhookUrl: 'https://example.com/webhook' },
};
const entries = new Map<string, unknown>();
const revoked: string[] = [];
const sent: unknown[] = [];
let gateways = 0;
let currentUserId = 'owner';
const room: SupportRoom = Object.assign(new SupportRoom(), { id: 'room', user: 'owner', title: 'Support', status: SupportRoomStatus.OPEN });
const messages: SupportMessage[] = [
  Object.assign(new SupportMessage(), { id: 'agent', room: 'room', content: 'Reply', senderType: SupportMessageSenderType.AGENT, readAt: null }),
  Object.assign(new SupportMessage(), { id: 'user', room: 'room', content: 'Question', senderType: SupportMessageSenderType.USER, readAt: null }),
];
const published: unknown[] = [];
const writes: string[] = [];
let qnaFilter: unknown;
const qna = Object.assign(new Qna(), { id: 'qna', user: 'owner', title: 'Question', status: QnaStatus.OPEN, answer: null });
const em = {
  fork: () => em,
  find: async (entity: unknown) => entity === SystemConfig
    ? Object.values(ServiceSystemConfigCode).filter(code => code in snapshot).map(code => ({ code, value: snapshot[code as keyof typeof snapshot] }))
    : entity === SupportMessage ? messages : [],
  findOne: async (entity: unknown, where: { id?: string, user?: string }) => entity === SupportRoom && where.id === room.id && (!where.user || where.user === 'owner') ? room : entity === Qna && where.id === qna.id && (!where.user || where.user === 'owner') ? qna : null,
  count: async () => 0,
  findByPage: async (_entity: unknown, where: unknown) => { qnaFilter = where; return { items: [], totalCount: 0, page: 1, pageSize: 20 }; },
  create: (entity: new () => object, data: object) => Object.assign(new entity(), { id: 'created-message', createdAt: new Date(), updatedAt: new Date() }, data),
  persist: () => {},
  flush: async () => { writes.push('flush'); },
};
@Global()
@Module({ providers: [
  { provide: AppEntityManager, useValue: em },
  { provide: PrincipalContext, useValue: { ensureUser: () => ({ id: currentUserId }) } },
  { provide: USER_AUTH_SERVICE, useValue: {} },
  { provide: TokenStore, useValue: { listUserTokens: async () => [{ familyId: 'family', rememberMe: false, expiresAt: Date.now() + 1000 }], revokeTokenFamily: async (id: string) => { revoked.push(id); }, revokeUserTokens: async () => {} } },
  { provide: KvStore, useValue: { get: async (key: string) => entries.get(key), set: async (key: string, value: unknown) => { entries.set(key, value); }, getAndDelete: async (key: string) => { const value = entries.get(key); entries.delete(key); return value ?? null; } } },
  { provide: RealtimeService, useValue: { registerSocketNamespace: () => { gateways++; }, emitSocket: async () => {} } },
  { provide: EventBroker, useValue: { publish: async (event: unknown) => { writes.push('publish'); published.push(event); } } },
  { provide: EVENT_BROKER.REDIS_PUBSUB, useValue: { publish: async () => {} } },
  { provide: StorageService, useValue: {} },
  { provide: NotificationService, useValue: { send: async (value: unknown) => { sent.push(value); } } },
], exports: [AppEntityManager, PrincipalContext, USER_AUTH_SERVICE, TokenStore, KvStore, RealtimeService, EventBroker, EVENT_BROKER.REDIS_PUBSUB, StorageService, NotificationService] })
class TestDependenciesModule {}
const selectedModules = new Set<unknown>([MembershipsModule, CustomersModule, ServiceTermsModule, SupportModule, QnaModule, FaqsModule, EventsModule, NoticesModule]);
const domainImports = (Reflect.getMetadata('imports', DomainModule) as NonNullable<ModuleMetadata['imports']>).filter(module => selectedModules.has(module));
@Module({ imports: [ScheduleModule.forRoot(), TestDependenciesModule, ...domainImports] })
class TestModule {}

test('real child modules resolve CQRS, static membership/agreement routes, and register one gateway/event handler', async () => {
  const app = await NestFactory.create(TestModule, { logger: false, abortOnError: false });
  try {
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(0, '127.0.0.1');
    assert.equal(gateways, 1);
    assert.equal(app.get(SchedulerRegistry).getIntervals().length, 2);
    const base = await app.getUrl();
    const memberships = await fetch(`${base}/internal/customers/memberships`);
    assert.equal(memberships.status, 200);
    assert.deepEqual(await memberships.json(), { items: [] });
    const sessions = await fetch(`${base}/internal/customers/customer/sessions`);
    assert.equal(sessions.status, 200);
    assert.equal((await sessions.json() as { items: { familyId: string }[] }).items[0].familyId, 'family');
    const agreements = await fetch(`${base}/service-terms/agreements`);
    assert.equal(agreements.status, 200);
    assert.deepEqual(await agreements.json(), { items: [] });
    app.get(EventBus).publish(new SupportRoomCreatedEvent(room.id));
    await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(sent.length, 1);

    const sessionsController = app.get(InternalCustomerSessionsController);
    await assert.rejects(() => sessionsController.revokeCustomerSession('customer', 'foreign'), (error: unknown) => (error as { code: string }).code === 'CUSTOMER_SESSION_NOT_FOUND');
    assert.deepEqual(revoked, []);
    await sessionsController.revokeCustomerSession('customer', 'family');
    assert.deepEqual(revoked, ['family']);

    const queries = app.get(QueryBus);
    const commands = app.get(CommandBus);
    currentUserId = 'intruder';
    await assert.rejects(() => queries.execute(new GetOwnSupportRoomQuery({ roomId: room.id })), (error: unknown) => (error as { code: string }).code === 'SUPPORT_ROOM_NOT_FOUND');
    await assert.rejects(() => commands.execute(new UpdateOwnSupportRoomCommand({ roomId: room.id, dto: { status: SupportRoomStatus.CLOSED } })), (error: unknown) => (error as { code: string }).code === 'SUPPORT_ROOM_NOT_FOUND');
    assert.equal(room.status, SupportRoomStatus.OPEN);
    assert.equal((await queries.execute(new GetSupportRoomQuery({ roomId: room.id }))).id, room.id);
    currentUserId = 'owner';
    await assert.rejects(() => queries.execute(new GetOwnSupportRoomQuery({ roomId: 'foreign' })), (error: unknown) => (error as { code: string }).code === 'SUPPORT_ROOM_NOT_FOUND');
    await queries.execute(new GetOwnSupportMessagesQuery({ roomId: room.id }));
    assert.ok(messages[0].readAt instanceof Date);
    assert.equal(messages[1].readAt, null);
    room.status = SupportRoomStatus.CLOSED;
    await assert.rejects(() => commands.execute(new CreateOwnSupportMessageCommand({ roomId: room.id, dto: { content: 'Blocked' } })), (error: unknown) => (error as { code: string }).code === 'SUPPORT_ROOM_CLOSED');

    const before = published.length;
    await commands.execute(new UpdateQnaCommand({ qnaId: qna.id, dto: { answer: 'Answer' } }));
    assert.equal(qna.status, QnaStatus.ANSWERED);
    assert.equal(published.length, before + 1);
    assert.equal((published.at(-1) as { userId: string }).userId, 'owner');
    assert.deepEqual(writes.slice(-2), ['flush', 'publish']);
    await commands.execute(new UpdateQnaCommand({ qnaId: qna.id, dto: { answer: 'Answer' } }));
    assert.equal(published.length, before + 1);
    await queries.execute(new GetOwnQnasQuery(GetQnasRequestDto.parse({})));
    assert.equal((qnaFilter as { $and: { user?: string }[] }).$and[1].user, 'owner');
    room.status = SupportRoomStatus.OPEN;
    const reply = await commands.execute(new CreateSupportMessageCommand({ roomId: room.id, dto: { content: 'Agent reply' } }));
    assert.equal(reply.content, 'Agent reply');
    assert.equal(room.status, SupportRoomStatus.IN_PROGRESS);
    assert.equal((published.at(-1) as { userId: string }).userId, 'owner');
    assert.deepEqual(writes.slice(-2), ['flush', 'publish']);

  }
  finally { await app.close(); }
});


test('session expiration changes at the exact expiry time', async (context) => {
  const { Session } = await import('../src/core/database/entities/auth/session.entity');
  const now = new Date('2030-01-01T00:00:00Z');
  context.mock.timers.enable({ apis: ['Date'], now });
  const session = Object.assign(new Session(), { expiresAt: new Date(now.getTime() + 1000) });
  assert.equal(session.isExpired, false);
  context.mock.timers.tick(1000);
  assert.equal(session.isExpired, true);
  context.mock.timers.tick(1000);
  assert.equal(session.isExpired, true);
  session.expiresAt = new Date(now.getTime() + 3000);
  assert.equal(session.isExpired, false);
});
