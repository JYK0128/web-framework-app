import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApplicationError } from '@pkg/shared/common';
import type { AppEntityManager } from '../src/core/database/entity-manager';
import type { InternalClient } from '../src/core/http/internal-client';
import { UpdateSystemConfigCommand } from '../src/modules/system-config/update-system-config.command';
import { UpdateSystemConfigHandler } from '../src/modules/system-config/update-system-config.handler';
import { UpdateSystemConfigRequestDto } from '../src/modules/system-config/update-system-config.request.dto';

const email = { from: 'admin@example.com', smtpHost: 'smtp.example.com', smtpPort: 587, smtpSecure: false, smtpUser: 'admin' };
const webhook = { cooldownMinutes: 10, enabled: false, type: 'SLACK' };
function setup() {
  let stored = { email: { value: { from: 'old@example.com', smtp: { host: 'smtp.example.com', port: 587, secure: false, user: 'admin', pass: 'secret' } } }, webhook: { value: webhook } };
  let failCommit = false;
  let failRemote = false;
  const requests: Record<string, unknown>[] = [];
  const em = { transactional: async (work: (tx: unknown) => Promise<void>) => {
    const staged = structuredClone(stored);
    await work({ findOne: async (_entity: unknown, where: { code: string }) => staged[where.code as keyof typeof staged] });
    if (failCommit) throw new Error('database commit failed');
    stored = staged;
  } };
  const client = { fetch: async (_path: string, options: { body: Record<string, unknown> }) => {
    requests.push(options.body);
    if (failRemote) throw new Error('upstream timeout');
    return Object.keys(options.body);
  } };
  const handler = new UpdateSystemConfigHandler(em as unknown as AppEntityManager, client as unknown as InternalClient);
  return { handler, requests, stored: () => stored, failCommit: () => { failCommit = true; }, failRemote: (value: boolean) => { failRemote = value; } };
}
const command = (input: unknown) => new UpdateSystemConfigCommand(UpdateSystemConfigRequestDto.parse(input).validate());

test('email-only update stays local and reports its saved key', async () => {
  const context = setup();
  const result = await context.handler.execute(command({ adminEmail: email }));
  assert.deepEqual(result.updatedKeys, ['adminEmail']);
  assert.deepEqual(result.syncedKeys, []);
  assert.equal(context.requests.length, 0);
});

test('invalid local webhook rolls back the staged email without calling service-api', async () => {
  const context = setup();
  const invalid = new UpdateSystemConfigCommand({ adminEmail: email, webhook: { ...webhook, cooldownMinutes: 0 } } as UpdateSystemConfigRequestDto);
  await assert.rejects(() => context.handler.execute(invalid));
  assert.equal(context.stored().email.value.from, 'old@example.com');
  assert.equal(context.requests.length, 0);
});

test('local commit failure prevents remote changes', async () => {
  const context = setup();
  context.failCommit();
  await assert.rejects(() => context.handler.execute(command({ adminEmail: email, oauth: {} })), /database commit failed/);
  assert.equal(context.stored().email.value.from, 'old@example.com');
  assert.equal(context.requests.length, 0);
});

test('remote failure reports confirmed local saves and unknown remote state; same payload can be retried', async () => {
  const context = setup();
  const input = command({ adminEmail: email, webhook, oauth: {} });
  context.failRemote(true);
  await assert.rejects(() => context.handler.execute(input), (error: unknown) => {
    assert.ok(error instanceof ApplicationError);
    assert.equal(error.code, 'SYSTEM_CONFIG_UPDATE_INCOMPLETE');
    assert.equal(error.status, 503);
    assert.deepEqual(error.details, { ok: false, updatedKeys: ['adminEmail', 'webhook'], syncedKeys: [], unconfirmedKeys: ['oauth', 'webhook'] });
    assert.equal(error.toJSON().success, false);
    assert.ok(error.cause instanceof Error);
    return true;
  });
  assert.equal(context.stored().email.value.from, email.from);
  assert.equal(context.requests.length, 1);
  assert.deepEqual(Object.keys(context.requests[0]), ['oauth', 'webhook']);
  context.failRemote(false);
  const result = await context.handler.execute(input);
  assert.deepEqual(result.updatedKeys, ['adminEmail', 'webhook', 'oauth']);
  assert.deepEqual(result.syncedKeys, ['webhook']);
  assert.deepEqual(result.unconfirmedKeys, []);
  assert.deepEqual(context.requests[1], context.requests[0]);
});

test('service-only timeout never claims that remote settings were saved', async () => {
  const context = setup();
  context.failRemote(true);
  await assert.rejects(() => context.handler.execute(command({ oauth: {} })), (error: unknown) => {
    assert.ok(error instanceof ApplicationError);
    assert.deepEqual(error.details, { ok: false, updatedKeys: [], syncedKeys: [], unconfirmedKeys: ['oauth'] });
    return true;
  });
});
