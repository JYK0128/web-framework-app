import { BrokerEventHandlers } from '../src/core/event-broker/broker-event-handlers.service';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Global, Module, ValidationPipe } from '@nestjs/common';
import { DiscoveryModule, NestFactory } from '@nestjs/core';
import { AdminPermission } from '@pkg/shared';
import { maskEmail, maskName } from '@pkg/shared/common';
import { USER_AUTH_SERVICE } from '../src/core/auth/user/user-auth.interface';
import { AppEntityManager } from '../src/core/database/entity-manager';
import { EVENT_BROKER } from '../src/core/event-broker/event-broker.interface';
import { PrincipalContext } from '../src/core/http/contexts/principal.context';
import { InternalClient } from '../src/core/http/internal-client';
import { LogTelemetryService } from '../src/core/log-telemetry/log-telemetry.service';
import { LogsModule } from '../src/modules/logs/logs.module';
import { RealtimeService } from '../src/core/realtime/realtime.service';
import { CustomersModule } from '../src/modules/customers/customers.module';
import { CustomerProfileController } from '../src/modules/customers/profile/profile.controller';
import { OperatorsModule } from '../src/modules/operators/operators.module';
import { SupportModule } from '../src/modules/support/support.module';
import { SupportRoomsController } from '../src/modules/support/rooms/rooms.controller';
import { SupportMessagesController } from '../src/modules/support/messages/messages.controller';

const customer = { id: 'customer', name: '홍길동', email: 'hong@example.com' };
const subscriptions = { opened: 0, closed: 0, gateways: 0 };
const upstream = { fetch: async (path: string) => {
  if (path === '/internal/customers/customer') return customer;
  if (path.startsWith('/internal/customers?')) return { items: [customer], page: 1, totalCount: 1 };
  throw new Error(`Unexpected upstream path: ${path}`);
} };

@Global()
@Module({ imports: [DiscoveryModule], providers: [
  BrokerEventHandlers,
  { provide: InternalClient, useValue: upstream },
  { provide: AppEntityManager, useValue: { count: async () => 2 } },
  { provide: PrincipalContext, useValue: {} },
  { provide: USER_AUTH_SERVICE, useValue: {} },
  { provide: RealtimeService, useValue: { registerSocketNamespace: () => { subscriptions.gateways += 1; } } },
  { provide: EVENT_BROKER.REDIS_PUBSUB, useValue: { adapterName: 'redis-pubsub', subscribe: async () => { subscriptions.opened += 1; return async () => { subscriptions.closed += 1; }; } } },
], exports: [InternalClient, AppEntityManager, PrincipalContext, USER_AUTH_SERVICE, RealtimeService, EVENT_BROKER.REDIS_PUBSUB] })
class TestDependenciesModule {}
@Module({ imports: [TestDependenciesModule, CustomersModule, OperatorsModule, SupportModule] })
class TestModule {}

test('child modules resolve dependencies and CQRS handlers; static PII/overview routes precede identifier routes', async () => {
  const app = await NestFactory.create(TestModule, { logger: false, abortOnError: false });
  try {
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(0, '127.0.0.1');
    assert.deepEqual(subscriptions, { opened: 1, closed: 0, gateways: 1 });
    const base = await app.getUrl();
    const pii = await fetch(`${base}/customers/pii`);
    assert.equal(pii.status, 200);
    assert.deepEqual((await pii.json() as { items: unknown[] }).items, [customer]);
    const detail = await fetch(`${base}/customers/customer`);
    assert.equal(detail.status, 200);
    const masked = await detail.json() as { name: string, email: string };
    assert.equal(masked.name, maskName(customer.name));
    assert.equal(masked.email, maskEmail(customer.email));
    const overview = await fetch(`${base}/operators/overview`);
    assert.equal(overview.status, 200);
    assert.equal((await overview.json() as { totalOperators: number }).totalOperators, 2);
  }
  finally { await app.close(); }
  assert.equal(subscriptions.closed, 1);
});

test('customer and support PII permissions and masking survive controller separation', async () => {
  assert.equal(Reflect.getMetadata('authMode', CustomerProfileController), 'user');
  assert.deepEqual(Reflect.getMetadata('permissions', CustomerProfileController.prototype.listCustomerPii), [AdminPermission.customer.piiRead.code]);
  assert.deepEqual(Reflect.getMetadata('permissions', CustomerProfileController.prototype.getCustomer), [AdminPermission.customer.read.code]);
  const rawRoom = { id: 'room', title: 'hong@example.com', userName: '홍길동' };
  const rawMessages = { items: [{ id: 'message', senderType: 'user', senderName: '홍길동', content: 'hong@example.com 010-1234-5678 900101-1234567 이름: 홍길동' }] };
  const client = { fetch: async (path: string) => path.endsWith('/messages') ? rawMessages : rawRoom } as unknown as InternalClient;
  const rooms = new SupportRoomsController(client);
  const messages = new SupportMessagesController(client);
  const maskedRoom = await rooms.getRoom('room');
  assert.equal(maskedRoom.title, maskEmail(rawRoom.title));
  assert.equal(maskedRoom.userName, maskName(rawRoom.userName));
  const masked = await messages.listMessages('room');
  assert.equal(masked.items[0].senderName, maskName('홍길동'));
  for (const pii of ['hong@example.com', '010-1234-5678', '900101-1234567', '홍길동']) assert.ok(!masked.items[0].content.includes(pii));
  assert.equal(await messages.listMessagePii('room'), rawMessages);
  assert.deepEqual(Reflect.getMetadata('permissions', SupportMessagesController.prototype.listMessagePii), [AdminPermission.support.piiRead.code]);
});

test('admin content PATCH DTOs leave defaulted fields omitted and reject invalid nulls', async () => {
  const { plainToInstance } = await import('class-transformer');
  const { validateSync } = await import('class-validator');
  const { UpdateNoticeRequestDto } = await import('../src/modules/notices/update-notice.request.dto');
  const { UpdateEventRequestDto } = await import('../src/modules/events/update-event.request.dto');
  const { UpdateFaqRequestDto } = await import('../src/modules/faqs/update-faq.request.dto');
  for (const [Dto, input, omitted] of [
    [UpdateNoticeRequestDto, { title: 'New' }, ['importance', 'isPinned']],
    [UpdateEventRequestDto, { title: 'New' }, ['startsAt', 'endsAt']],
    [UpdateFaqRequestDto, { question: 'New' }, ['isPublished', 'sortOrder']],
  ] as const) {
    const dto = plainToInstance(Dto as new () => object, input);
    assert.deepEqual(validateSync(dto), []);
    for (const field of omitted) {
      assert.equal(Reflect.get(dto, field), undefined);
      assert.ok(validateSync(plainToInstance(Dto as new () => object, { [field]: null })).length > 0);
    }
  }
});

test('admin notice publication dates can be scheduled or cleared without a status field', async () => {
  const { plainToInstance } = await import('class-transformer');
  const { validateSync } = await import('class-validator');
  const { UpdateNoticeRequestDto } = await import('../src/modules/notices/update-notice.request.dto');
  assert.equal(plainToInstance(UpdateNoticeRequestDto, {}).publishedAt, undefined);
  for (const publishedAt of [null, '2099-01-01T00:00:00Z']) assert.deepEqual(validateSync(plainToInstance(UpdateNoticeRequestDto, { publishedAt })), []);
  assert.ok(validateSync(plainToInstance(UpdateNoticeRequestDto, { publishedAt: 'invalid' })).length > 0);
});

test('admin role, membership, Q&A and support validation rejects invalid nulls and permission strings', async () => {
  const { plainToInstance } = await import('class-transformer');
  const { validateSync } = await import('class-validator');
  const { UpdateRoleRequestDto } = await import('../src/modules/roles/update-role.request.dto');
  const { UpdateMembershipRequestDto } = await import('../src/modules/memberships/update-membership.request.dto');
  const { CreateMembershipRequestDto } = await import('../src/modules/memberships/create-membership.request.dto');
  const { UpdateQnaRequestDto } = await import('../src/modules/qna/update-qna.request.dto');
  const { UpdateSupportRoomRequestDto } = await import('../src/modules/support/rooms/update-support-room.request.dto');
  for (const [Dto, fields] of [
    [UpdateRoleRequestDto, ['label', 'description', 'permissions']],
    [UpdateMembershipRequestDto, ['label', 'description', 'permissions']],
    [UpdateQnaRequestDto, ['status', 'priority', 'answer']],
    [UpdateSupportRoomRequestDto, ['status']],
  ] as const) {
    assert.deepEqual(validateSync(plainToInstance(Dto as new () => object, {})), []);
    for (const field of fields) assert.ok(validateSync(plainToInstance(Dto as new () => object, { [field]: null })).length > 0, `${Dto.name}.${field}`);
  }
  assert.deepEqual(validateSync(plainToInstance(UpdateQnaRequestDto, { assigneeId: null })), []);
  assert.ok(validateSync(plainToInstance(UpdateMembershipRequestDto, { permissions: 'read' })).length > 0);
  assert.deepEqual(validateSync(plainToInstance(UpdateMembershipRequestDto, { permissions: [] })), []);
  assert.ok(validateSync(plainToInstance(CreateMembershipRequestDto, { code: 'vip', label: 'VIP', permissions: 'read' })).length > 0);
});


test('log HTTP responses preserve telemetry fields and pagination after CQRS service removal', async () => {
  const entry = {
    id: 'log-1', createdAt: new Date('2026-10-13T00:00:00Z'), level: 'error', method: 'GET',
    url: '/api/v1/example', statusCode: 500, duration: 42, requestId: 'request-1',
    ip: '127.0.0.1', userAgent: null, emailHash: null, requestBody: null,
    responseBody: { message: 'failed' },
    errorInfo: { name: 'Error', code: null, message: 'failed', details: null, stack: null, sql: null },
    nanoTimestamp: '1791849600000000000',
  };
  let requested: unknown;
  @Global()
  @Module({ providers: [{ provide: LogTelemetryService, useValue: {
    getLogs: async (query: unknown) => { requested = query; return { items: [entry], totalCount: 3 }; },
    getStats: async () => ({ totalRequests: 3, errorCount: 1, avgDuration: 42, errorRate: 33.3 }),
  } }], exports: [LogTelemetryService] })
  class LogDependenciesModule {}
  @Module({ imports: [LogDependenciesModule, LogsModule] })
  class LogTestModule {}
  const app = await NestFactory.create(LogTestModule, { logger: false, abortOnError: false });
  try {
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const response = await fetch(`${base}/logs?page=2&limit=1&search=example&method=GET&status=error`);
    assert.equal(response.status, 200);
    const body = await response.json() as { items: unknown[], page: number, totalPages: number, hasNextPage: boolean, hasPrevPage: boolean };
    assert.deepEqual(body.items, [JSON.parse(JSON.stringify(entry))]);
    assert.deepEqual(requested, { search: 'example', method: 'GET', status: 'error', limit: 1, offset: 1 });
    assert.equal(body.page, 2);
    assert.equal(body.totalPages, 3);
    assert.equal(body.hasNextPage, true);
    assert.equal(body.hasPrevPage, true);
    const stats = await fetch(`${base}/logs/stats`);
    assert.equal(stats.status, 200);
    assert.deepEqual(await stats.json(), { total: 3, errors: 1, averageDurationMs: 42, errorRate: 33.3 });
  } finally { await app.close(); }
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

test('operator mutations require assigned permissions regardless of the caller role name', async () => {
  const { CommandBus } = await import('@nestjs/cqrs');
  const { Reflector } = await import('@nestjs/core');
  const { ApplicationError } = await import('@pkg/shared/common');
  const { PermissionGuard } = await import('../src/core/http/guards/permission.guard');
  const { ApplicationErrorFilter } = await import('../src/core/http/filters/application-error.filter');
  const { OperatorAccountController } = await import('../src/modules/operators/account/account.controller');
  const { OperatorAccessController } = await import('../src/modules/operators/access/access.controller');
  const permissions = [AdminPermission.operator.create, AdminPermission.operator.delete, AdminPermission.operator.restore, AdminPermission.operator.update, AdminPermission.operator.changeRole, AdminPermission.operator.reset2fa].map((permission) => permission.code);
  let caller: { id: string, type: 'user', roles: string[], permissions: string[] } | null = null;
  let calls = 0;
  const principal = { ensureUser: () => {
    if (!caller) throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: 401 });
    return caller;
  } } as unknown as PrincipalContext;
  @Module({ controllers: [OperatorAccountController, OperatorAccessController], providers: [{ provide: CommandBus, useValue: { execute: async () => { calls++; return { ok: true }; } } }] })
  class BoundaryTestModule {}
  const app = await NestFactory.create(BoundaryTestModule, { logger: false, abortOnError: false });
  try {
    app.use((request: { t?: (key: string) => string }, _response: unknown, next: () => void) => { request.t = (key) => key; next(); });
    app.useGlobalGuards(new PermissionGuard(new Reflector(), principal));
    app.useGlobalFilters(new ApplicationErrorFilter());
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const routes = [
      ['POST', '/operators', 201], ['DELETE', '/operators/target', 200], ['POST', '/operators/target/restore', 200],
      ['POST', '/operators/target/ban', 200], ['POST', '/operators/target/unban', 200],
      ['PATCH', '/operators/target/role', 200], ['POST', '/operators/target/2fa/reset', 200],
    ] as const;
    for (const [method, path, success] of routes) {
      const invoke = () => fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: '{}' });
      caller = null;
      assert.equal((await invoke()).status, 401);
      caller = { id: 'caller', type: 'user', roles: ['super_admin'], permissions: [] };
      assert.equal((await invoke()).status, 403);
      const before = calls;
      caller = { id: 'caller', type: 'user', roles: ['delegated_operator'], permissions };
      assert.equal((await invoke()).status, success);
      assert.equal(calls, before + 1);
    }
    assert.equal(calls, routes.length);
  } finally { await app.close(); }
});
