import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApplicationError } from '@pkg/shared/common';
import type { MachineAuthIssuer, MachineConnection } from '../src/core/auth/machine/machine-auth.interface';
import type { RequestContext } from '../src/core/http/contexts/request.context';
import { httpClient } from '../src/core/http/http-client';
import { InternalClient } from '../src/core/http/internal-client';
import { ServiceTermDocumentsController } from '../src/modules/service-terms/documents/documents.controller';
import { ServiceTermGroupsController } from '../src/modules/service-terms/groups/groups.controller';
import { ServiceTermRevisionsController } from '../src/modules/service-terms/revisions/revisions.controller';
import { CreateServiceTermRequestDto } from '../src/modules/service-terms/documents/create-service-term.request.dto';
import { UpdateServiceTermRequestDto } from '../src/modules/service-terms/documents/update-service-term.request.dto';
import { UpdateServiceTermGroupRequestDto } from '../src/modules/service-terms/groups/update-service-term-group.request.dto';

const invalid = (error: unknown) => error instanceof ApplicationError && error.code === 'VALIDATION_ERROR';
test('proxy DTOs reject oversized versions/null updates and preserve omitted group fields', () => {
  const group = UpdateServiceTermGroupRequestDto.parse({ title: 'Renamed' }).validate();
  assert.equal(group.isRequired, undefined);
  assert.equal(group.sortOrder, undefined);
  for (const field of ['title', 'isRequired', 'sortOrder']) {
    assert.throws(() => UpdateServiceTermGroupRequestDto.parse({ [field]: null }).validate(), invalid);
  }
  assert.throws(() => UpdateServiceTermRequestDto.parse({ version: 'v'.repeat(51) }).validate(), invalid);
  assert.throws(() => CreateServiceTermRequestDto.parse({ groupId: '00000000-0000-4000-8000-000000000001', version: 'v'.repeat(51), content: 'C', reason: 'R', summary: 'S', isNoticeRequired: false }).validate(), invalid);
  assert.doesNotThrow(() => UpdateServiceTermRequestDto.parse({ publishedAt: null, metadata: null, isNoticeRequired: false }).validate());
});

test('proxy forwards a partial group patch without error-code options', async () => {
  let sent: unknown;
  const client = { fetch: async (path: string, options: unknown) => { sent = { path, options }; return { id: 'group' }; } };
  const controller = new ServiceTermGroupsController(client as unknown as InternalClient);
  await controller.updateGroup('group', UpdateServiceTermGroupRequestDto.parse({ title: 'New' }).validate());
  assert.deepEqual(sent, { path: '/internal/service-terms/groups/group', options: { method: 'PATCH', body: UpdateServiceTermGroupRequestDto.parse({ title: 'New' }) } });
  assert.equal(Reflect.getMetadata('__httpCode__', ServiceTermDocumentsController.prototype.publish), 200);
});

test('InternalClient preserves upstream codes and normalizes server failures, and fails closed on issuer failure', async () => {
  const original = httpClient.request;
  let status = 409;
  let errorCode = 'SERVICE_TERM_VERSION_ALREADY_EXISTS';
  httpClient.request = (async () => ({ status, data: { errorCode, details: { version: '1' } } })) as typeof httpClient.request;
  const issuer = { issue: async () => ({ type: 'bearer', value: 'test-token' }) } as unknown as MachineAuthIssuer;
  const connection = { targetService: 'service-api', baseUrl: 'http://localhost:4000' } as MachineConnection;
  const client = new InternalClient(issuer, {} as RequestContext, connection);
  const matches = (code: string, expectedStatus: number) => (error: unknown) => error instanceof ApplicationError && error.code === code && error.status === expectedStatus;
  try {
    await assert.rejects(() => client.fetch('/internal/service-terms'), matches(errorCode, 409));
    errorCode = 'AUTHENTICATION_REQUIRED'; status = 401;
    await assert.rejects(() => client.fetch('/internal/service-terms'), matches('AUTHENTICATION_REQUIRED', 401));
    errorCode = 'SERVICE_TERM_NOT_FOUND'; status = 500;
    await assert.rejects(() => client.fetch('/internal/service-terms'), matches('SERVICE_TERM_NOT_FOUND', 502));
    const failure = new Error('issuer unavailable');
    const unavailable = new InternalClient({ issue: async () => { throw failure; } } as unknown as MachineAuthIssuer, {} as RequestContext, connection);
    await assert.rejects(() => unavailable.fetch('/internal/service-terms'), (error) => error === failure);
  }
  finally { httpClient.request = original; }
});

test('InternalClient shares error translation across fetch/upload/download and retains translation params', async () => {
  const originalRequest = httpClient.request;
  const originalGet = httpClient.get;
  let status = 400;
  let body: unknown = { errorCode: 'VALIDATION_ERROR', message: 'Untrusted upstream message', details: [{ field: 'title' }], meta: { params: { max: 50 } } };
  httpClient.request = (async () => ({ status, data: body })) as typeof httpClient.request;
  httpClient.get = (async () => ({ status, data: Buffer.from(JSON.stringify(body)) })) as typeof httpClient.get;
  const client = new InternalClient({ issue: async () => ({ type: 'bearer', value: 'test' }) } as unknown as MachineAuthIssuer, {} as RequestContext, { targetService: 'service-api', baseUrl: 'http://localhost:4000' } as MachineConnection);
  try {
    for (const call of [() => client.fetch('/internal/test'), () => client.upload('/internal/test', Buffer.from('test'), 'text/plain'), () => client.download('/internal/test')]) {
      await assert.rejects(call, (error: unknown) => {
        assert.ok(error instanceof ApplicationError);
        assert.equal(error.code, 'VALIDATION_ERROR');
        assert.equal(error.message, 'VALIDATION_ERROR');
        assert.equal(error.status, 400);
        assert.deepEqual(error.params, { max: 50 });
        assert.deepEqual(error.details, [{ field: 'title' }]);
        assert.deepEqual(error.toJSON().meta, { params: { max: 50 } });
        return true;
      });
    }
    status = 503; body = { errorCode: 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED' };
    await assert.rejects(() => client.fetch('/internal/test'), (error: unknown) => error instanceof ApplicationError && error.code === 'SYSTEM_CONFIG_RUNTIME_SYNC_FAILED' && error.status === 502);
    for (const malformed of ['not json', { errorCode: '' }, { errorCode: 123 }, null]) {
      body = malformed;
      await assert.rejects(() => client.fetch('/internal/test'), (error: unknown) => error instanceof ApplicationError && error.code === 'INTERNAL_SERVICE_CALL_FAILED' && error.status === 502);
    }
    status = 200; body = { data: { ok: true } };
    assert.deepEqual(await client.fetch('/internal/test'), { ok: true });
  }
  finally { httpClient.request = originalRequest; httpClient.get = originalGet; }
});

test('revision proxy forwards pagination and requires service-term read permission', async () => {
  const { GetServiceTermRevisionsRequestDto } = await import('../src/modules/service-terms/revisions/get-service-term-revisions.request.dto');
  const { AdminPermission } = await import('@pkg/shared');
  let sent: unknown;
  const response = { items: [{ id: 'revision', version: '1' }], page: 2, totalCount: 3 };
  const client = { fetch: async (path: string, options: unknown) => { sent = { path, options }; return response; } };
  const controller = new ServiceTermRevisionsController(client as unknown as InternalClient);
  assert.equal(await controller.getRevisions('group', Object.assign(new GetServiceTermRevisionsRequestDto(), { page: 2, limit: 1 })), response);
  assert.deepEqual(sent, { path: '/internal/service-terms/groups/group/revisions?page=2&limit=1', options: undefined });
  assert.deepEqual(Reflect.getMetadata('permissions', ServiceTermRevisionsController.prototype.getRevisions), [AdminPermission.serviceTerm.read.code]);
});
