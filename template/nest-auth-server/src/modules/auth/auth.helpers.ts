import type { EntityManager } from '@mikro-orm/core';

import { requestContext } from '#/common/context/request-context';
import { Account } from '#/entities/auth/account.entity';
import { Session } from '#/entities/auth/session.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';

import type { AuthSession, PublicUser } from './auth.types';
import { createSessionToken } from './session-cookie';

export const CREDENTIAL_PROVIDER = 'credential';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    emailVerified: user.emailVerified,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createSession(
  em: EntityManager,
  user: User,
): Promise<AuthSession> {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);
  const session = new Session();
  session.token = token;
  session.user = user;
  session.expiresAt = expiresAt;
  const tracking = requestContext.getTracking();
  session.ipAddress = tracking?.ipAddress ?? null;
  session.userAgent = tracking?.userAgent ?? null;

  em.persist(session);

  return { token, expiresAt };
}

export function createCredentialAccount(user: User, password: string): Account {
  const account = new Account();
  account.user = user;
  account.accountId = user.id;
  account.providerId = CREDENTIAL_PROVIDER;
  account.password = password;
  return account;
}
