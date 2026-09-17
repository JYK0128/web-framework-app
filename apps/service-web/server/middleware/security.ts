import { randomBytes } from 'node:crypto';

import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import type { RequestHandler, Response } from 'express';
import helmet from 'helmet';

import { csrfCookieName, getCookie, sessionCookieName } from '~/config/cookie';
import { env } from '~/config/env';

const isProduction = env.NODE_ENV === 'production';
const cspSelf = `'self'`;
const cspNone = `'none'`;
const cspUnsafeInline = `'unsafe-inline'`;
const csrfSecret = env.CSRF_SECRET;
const anonymousSessionIdentifier = 'anonymous';

const cspNonceMiddleware: RequestHandler = (_req, res, next) => {
  res.locals.cspNonce = randomBytes(32).toString('base64');
  next();
};

const {
  doubleCsrfProtection,
  generateCsrfToken,
} = doubleCsrf({
  getSecret: () => csrfSecret,
  getSessionIdentifier: (req) =>
    getCookie(req, sessionCookieName) ?? anonymousSessionIdentifier,
  cookieName: csrfCookieName,
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: env.NODE_ENV === 'production',
    path: '/',
  },
  skipCsrfProtection: (req) => !req.path.startsWith('/api/v1/'),
  errorConfig: {
    statusCode: 403,
    code: 'CSRF_VALIDATION_FAILED',
    message: 'Invalid CSRF token',
  },
});

export const csrfTokenMiddleware: RequestHandler = (req, res) => {
  res.json({ csrfToken: generateCsrfToken(req, res) });
};

const permissionsPolicyMiddleware: RequestHandler = (_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  next();
};

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: [cspSelf],
      baseUri: [cspSelf],
      frameAncestors: [cspNone],
      objectSrc: [cspNone],
      imgSrc: [cspSelf, 'data:', 'blob:'],
      styleSrc: [cspSelf, cspUnsafeInline],
      scriptSrc: [
        cspSelf,
        (_req, res) => `'nonce-${(res as Response).locals.cspNonce}'`,
      ],
      connectSrc: [cspSelf, 'ws:'],
      workerSrc: [cspSelf],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  frameguard: { action: 'deny' },
  hsts: isProduction ? undefined : false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

export const securityMiddleware: RequestHandler[] = [
  cspNonceMiddleware,
  helmetMiddleware,
  cookieParser(),
  permissionsPolicyMiddleware,
  doubleCsrfProtection,
];
