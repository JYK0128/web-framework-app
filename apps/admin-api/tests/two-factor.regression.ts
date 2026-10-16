import 'reflect-metadata';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { encrypt } from '@pkg/shared/server';
import { SECURITY_CONFIG } from '../src/app.config';
import { env } from '../src/env';
import { User } from '../src/core/database/entities/auth';
import { TwoFactor } from '../src/core/database/entities/auth.extensions';
import { AppEntityManager } from '../src/core/database/entity-manager';
import type { PrincipalContext } from '../src/core/http/contexts/principal.context';
import type { KvStore } from '../src/core/kv-store/kv-store.service';
import type { IUserAuthService } from '../src/core/auth/user/user-auth.interface';
import { EnableTwoFactorHandler } from '../src/modules/auth/two-factor/enable-two-factor.handler';
import { EnableTwoFactorCommand } from '../src/modules/auth/two-factor/enable-two-factor.command';
import { GenerateTwoFactorHandler } from '../src/modules/auth/two-factor/generate-two-factor.handler';
import { TwoFactorLoginHandler } from '../src/modules/auth/two-factor/two-factor-login.handler';
import { TwoFactorLoginCommand } from '../src/modules/auth/two-factor/two-factor-login.command';
import { AuthKvStoreKey } from '../src/modules/auth/auth.key';

const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
function validCode() {
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / (SECURITY_CONFIG.twoFactor.periodSeconds * 1000))));
  const digest = createHmac('sha1', Buffer.from('12345678901234567890')).update(counter).digest();
  const offset = digest[digest.length - 1] & 15;
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % (10 ** SECURITY_CONFIG.twoFactor.digits)).padStart(SECURITY_CONFIG.twoFactor.digits, '0');
}
const errorCode = (code: string) => (error: unknown) => (error as { code?: string }).code === code;

test('two-factor lock state and failure budget respect expiry boundaries', (context) => {
  const now = new Date('2030-01-01T00:00:00Z');
  context.mock.timers.enable({ apis: ['Date'], now });
  const factor = new TwoFactor();
  assert.deepEqual([factor.isLocked, factor.isLockExpired], [false, false]);
  for (let index = 1; index <= 5; index++) {
    factor.recordVerificationFailure(now, 5, 1000);
    assert.equal(factor.failedVerificationCount, index);
  }
  assert.deepEqual([factor.isLocked, factor.isLockExpired], [true, false]);
  context.mock.timers.tick(1000);
  assert.deepEqual([factor.isLocked, factor.isLockExpired], [false, true]);
  factor.recordVerificationFailure(new Date(), 5, 1000);
  assert.equal(factor.failedVerificationCount, 1);
  assert.equal(factor.lockedUntil, null);
  factor.resetVerificationFailures();
  assert.equal(factor.failedVerificationCount, 0);
});

const databaseUrl = process.env.TWO_FACTOR_TEST_DATABASE_URL;
test('PostgreSQL: concurrent setup/login failures commit, lock the account, survive reissuance and reset on success', { skip: !databaseUrl }, async () => {
  assert.match(new URL(databaseUrl!).pathname, /^\/two_factor_test_[a-z0-9_]+$/);
  const { MikroORM } = await import('@mikro-orm/postgresql');
  const { EntityCaseNamingStrategy } = await import('@mikro-orm/core');
  const originalEnabled = SECURITY_CONFIG.twoFactor.enabled;
  SECURITY_CONFIG.twoFactor.enabled = true;
  const orm = await MikroORM.init({ entities: [User, TwoFactor], entityManager: AppEntityManager, namingStrategy: EntityCaseNamingStrategy, clientUrl: databaseUrl, persistOnCreate: false });
  try {
    await orm.schema.create();
    const em = orm.em.fork();
    const user = em.create(User, { emailVerified: true });
    const factor = em.create(TwoFactor, { user, secret: encrypt(secret, env.TWO_FACTOR_ENCRYPTION_KEY), verified: false });
    em.persist([user, factor]); await em.flush();
    const principal = { ensureUser: () => ({ id: user.id }) } as unknown as PrincipalContext;
    const read = () => orm.em.fork().findOneOrFail(TwoFactor, factor.id);
    const enable = (code: string) => new EnableTwoFactorHandler(orm.em.fork(), principal).execute(new EnableTwoFactorCommand({ code }));
    await assert.rejects(() => enable('invalid'), errorCode('INVALID_TWO_FACTOR_CODE'));
    await new GenerateTwoFactorHandler(orm.em.fork(), principal).execute();
    assert.equal((await read()).failedVerificationCount, 1);
    const failures = await Promise.allSettled(Array.from({ length: 8 }, () => enable('invalid')));
    assert.ok(failures.every((result) => result.status === 'rejected' && ['INVALID_TWO_FACTOR_CODE', 'TWO_FACTOR_SETUP_LOCKED'].includes(result.reason.code)));
    assert.equal((await read()).failedVerificationCount, 5);
    assert.equal((await read()).isLocked, true);
    await assert.rejects(() => new GenerateTwoFactorHandler(orm.em.fork(), principal).execute(), errorCode('TWO_FACTOR_SETUP_LOCKED'));
    await orm.em.fork().nativeUpdate(TwoFactor, factor.id, { lockedUntil: new Date(Date.now() - 1000), secret: encrypt(secret, env.TWO_FACTOR_ENCRYPTION_KEY) });
    await assert.rejects(() => enable('invalid'), errorCode('INVALID_TWO_FACTOR_CODE'));
    assert.equal((await read()).failedVerificationCount, 1);
    await enable(validCode());
    assert.equal((await read()).failedVerificationCount, 0);
    assert.equal((await read()).lockedUntil, null);
    assert.equal((await orm.em.fork().findOneOrFail(User, user.id)).twoFactorEnabled, true);

    const records = new Map<string, string>();
    const kv = {
      get: async (key: string) => records.get(key) ?? null,
      set: async (key: string, value: string) => { records.set(key, value); },
      getTtlSeconds: async () => 300,
      delIfValue: async (key: string, value: string) => {
        if (records.get(key) !== value) return false;
        records.delete(key); return true;
      },
    } as unknown as KvStore;
    let logins = 0;
    const auth = { login: async () => { logins++; return { accessToken: 'test-access', refreshToken: 'test-refresh' }; } } as unknown as IUserAuthService;
    const challenge = (token: string) => records.set(AuthKvStoreKey.twoFactorLoginChallenge(token), JSON.stringify({ userId: user.id, rememberMe: false, attempts: 0 }));
    const login = (token: string, code: string) => new TwoFactorLoginHandler(orm.em.fork(), kv, auth).execute(new TwoFactorLoginCommand({ twoFactorChallengeToken: token, code }));
    const tokens = Array.from({ length: 8 }, (_, index) => `challenge-${index}`);
    tokens.forEach(challenge);
    const loginFailures = await Promise.allSettled(tokens.map((token) => login(token, 'invalid')));
    assert.ok(loginFailures.every((result) => result.status === 'rejected' && ['TWO_FACTOR_INVALID', 'TWO_FACTOR_LOCKED'].includes(result.reason.code)));
    assert.equal((await orm.em.fork().findOneOrFail(User, user.id)).isLocked, false);
    assert.equal((await read()).failedVerificationCount, 5);
    assert.equal((await read()).isLocked, true);
    challenge('new-challenge');
    await assert.rejects(() => login('new-challenge', validCode()), errorCode('TWO_FACTOR_LOCKED'));
    assert.equal(logins, 0);
    await orm.em.fork().nativeUpdate(TwoFactor, factor.id, { lockedUntil: new Date(Date.now() - 1000) });
    challenge('after-expiry');
    await assert.rejects(() => login('after-expiry', 'invalid'), errorCode('TWO_FACTOR_INVALID'));
    assert.equal((await read()).failedVerificationCount, 1);
    challenge('success');
    const successes = await Promise.allSettled([login('success', validCode()), login('success', validCode())]);
    assert.equal(successes.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(logins, 1);
    assert.equal((await read()).failedVerificationCount, 0);
    assert.equal((await read()).lockedUntil, null);
  } finally {
    await orm.schema.drop();
    await orm.close(true);
    SECURITY_CONFIG.twoFactor.enabled = originalEnabled;
  }
});
