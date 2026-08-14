import { createClient } from 'redis';

import { getEnv } from '../env';
import { SESSION_TTL_SECONDS } from './constants';

export type Session = {
  accessToken: string
  refreshToken: string
};

type RedisClient = ReturnType<typeof createClient>;

let redisClientPromise: Promise<RedisClient> | null = null;

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

export async function clearSession(sessionId?: string): Promise<void> {
  await deleteSession(sessionId);
}
