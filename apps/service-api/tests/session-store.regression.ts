import 'reflect-metadata';

import assert from 'node:assert/strict';
import { RedisSessionStore } from '../src/core/stores/redis-session.store';
import { SessionStore } from '@pkg/server-core/auth/user/session/session.store';
import { InMemoryAdapter } from '@pkg/server-core/kv-store/adapters/in-memory.adapter';
import { KvStore } from '@pkg/server-core/kv-store/kv-store.service';
import { Cookie, type SessionData } from 'express-session';

const adapter = new InMemoryAdapter();
const kv = new KvStore(adapter);
const options = {
  sessionSecret: 'test-only', cookieName: 'sid', cookieSecure: false,
  cookieSameSite: 'lax' as const, refreshIdleTimeoutMinutes: 30, rememberMeDays: 7,
};
const store: SessionStore = new RedisSessionStore(kv, options);
const session = (userId: string): SessionData => ({ userId, cookie: new Cookie({ maxAge: 60_000 }) });
const get = (target: SessionStore, id: string) => new Promise<SessionData | null | undefined>((resolve, reject) => {
  target.get(id, (error, value) => error ? reject(error) : resolve(value));
});
const set = (target: SessionStore, id: string, value: SessionData) => new Promise<void>((resolve, reject) => {
  target.set(id, value, (error) => error ? reject(error) : resolve());
});
const touch = (id: string, value: SessionData) => new Promise<void>((resolve, reject) => {
  store.touch(id, value, (error) => error ? reject(error) : resolve());
});
const destroy = (id: string) => new Promise<void>((resolve, reject) => {
  store.destroy(id, (error) => error ? reject(error) : resolve());
});

await Promise.all([
  set(store, 'one', session('alice')), set(store, 'two', session('alice')),
  set(store, 'three', session('bob')), kv.set('other:auth_session:one', session('alice'), 60),
]);
assert.ok((await get(store, 'one'))?.cookie.expires instanceof Date);
await store.destroyAll('alice');
assert.equal(await get(store, 'one'), null);
assert.equal(await get(store, 'two'), null);
assert.equal((await get(store, 'three'))?.userId, 'bob');
assert.equal((await kv.get<SessionData>('other:auth_session:one'))?.userId, 'alice');
await store.destroyAll('alice');

await set(store, 'renewed', session('alice'));
await touch('renewed', session('alice'));
await store.destroyAll('alice');
assert.equal(await get(store, 'renewed'), null);

await set(store, 'changed-owner', session('alice'));
await set(store, 'changed-owner', session('bob'));
await store.destroyAll('alice');
assert.equal((await get(store, 'changed-owner'))?.userId, 'bob');
await destroy('changed-owner');
assert.equal(await get(store, 'changed-owner'), null);
assert.equal((await kv.hGetAll('service-api:auth_user_sessions:bob'))['changed-owner'], undefined);

const failure = new Error('storage unavailable');
const originalSet = adapter.set.bind(adapter);
adapter.set = async () => { throw failure; };
await assert.rejects(set(store, 'failed', session('alice')), (error) => error === failure);
adapter.set = originalSet;
assert.equal(await get(store, 'failed'), null);
console.log('Session store regression checks passed.');
