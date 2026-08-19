import { randomBase64Url } from '@pkg/shared/server';
import { createClient, WatchError } from 'redis';

import { getEnv } from '../env';
import { SESSION_TTL_SECONDS } from './constants';

export type Session = {
  accessToken: string
  refreshToken: string
};

type RedisClient = ReturnType<typeof createClient>;

let redisClientPromise: Promise<RedisClient> | null = null;

const SESSION_REFRESH_LOCK_TTL_MS = 15_000;
const SESSION_REFRESH_LOCK_WAIT_MS = 25;
const SESSION_REFRESH_LOCK_MAX_WAIT_MS = 2_000;

async function getRedisClient(): Promise<RedisClient> {
  if (redisClientPromise) return redisClientPromise;

  const redisUrl = getEnv().REDIS_URL;

  const client = createClient({ url: redisUrl });
  client.on('error', (error: unknown) => console.error('[session] Redis error', error));
  redisClientPromise = client.connect().then(() => client);
  return redisClientPromise;
}

function sessionKey(sessionId: string): string {
  return `session:${sessionId}`;
}

function sessionRefreshLockKey(sessionId: string): string {
  return `session:refresh-lock:${sessionId}`;
}

async function releaseSessionRefreshLock(
  client: RedisClient,
  lockKey: string,
  lockValue: string,
): Promise<void> {
  const releaseClient = client.duplicate();
  releaseClient.on('error', (error: unknown) => console.error('[session] Redis lock error', error));

  try {
    await releaseClient.connect();
    await releaseClient.watch(lockKey);
    const currentValue = await releaseClient.get(lockKey);
    if (currentValue === lockValue) {
      try {
        await releaseClient.multi().del(lockKey).exec();
      }
      catch (error) {
        if (!(error instanceof WatchError)) throw error;
      }
    }
    else {
      await releaseClient.unwatch();
    }
  }
  finally {
    if (releaseClient.isOpen) await releaseClient.quit();
  }
}

async function deleteSession(sessionId?: string): Promise<void> {
  if (sessionId) await (await getRedisClient()).del(sessionKey(sessionId));
}

export async function getSession(sessionId?: string): Promise<Session | null> {
  if (!sessionId) return null;
  const value = await (await getRedisClient()).get(sessionKey(sessionId));
  if (!value) return null;

  try {
    return JSON.parse(value) as Session;
  }
  catch {
    await deleteSession(sessionId);
    return null;
  }
}

export async function saveSession(sessionId: string, session: Session): Promise<void> {
  await (await getRedisClient()).set(sessionKey(sessionId), JSON.stringify(session), {
    EX: SESSION_TTL_SECONDS,
  });
}

/**
 * Refresh token rotation is single-use. Serialize refreshes for one BFF session
 * across concurrent requests and across multiple BFF instances.
 */
export async function withSessionRefreshLock<T>(
  sessionId: string,
  callback: () => Promise<T>,
): Promise<T | undefined> {
  const client = await getRedisClient();
  const lockKey = sessionRefreshLockKey(sessionId);
  const lockValue = randomBase64Url(32);
  const deadline = Date.now() + SESSION_REFRESH_LOCK_MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const acquired = await client.set(lockKey, lockValue, {
      NX: true,
      PX: SESSION_REFRESH_LOCK_TTL_MS,
    });

    if (acquired === 'OK') {
      try {
        return await callback();
      }
      finally {
        await releaseSessionRefreshLock(client, lockKey, lockValue);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, SESSION_REFRESH_LOCK_WAIT_MS));
  }

  return undefined;
}

export async function clearSession(sessionId?: string): Promise<void> {
  await deleteSession(sessionId);
}
