import { randomBytes } from 'node:crypto';

import type { Request, Response } from 'express';

import { env } from '#/env';

export const SESSION_COOKIE = env.COOKIE_NAME;

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator === -1) continue;

    const name = cookie.slice(0, separator).trim();
    if (name !== SESSION_COOKIE) continue;

    const value = cookie.slice(separator + 1).trim();
    if (!value) return null;

    try {
      return decodeURIComponent(value);
    }
    catch {
      return null;
    }
  }

  return null;
}

export function setSessionCookie(response: Response, token: string, expiresAt: Date): void {
  response.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
    maxAge: Math.max(0, expiresAt.getTime() - Date.now()),
  });
}

export function clearSessionCookie(response: Response): void {
  response.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    secure: env.COOKIE_SECURE || env.NODE_ENV === 'production',
    sameSite: env.COOKIE_SAME_SITE,
    path: '/',
  });
}
