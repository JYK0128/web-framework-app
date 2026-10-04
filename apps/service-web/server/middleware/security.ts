import { randomBytes } from 'node:crypto';

import cookieParser from 'cookie-parser';
import type { RequestHandler, Response } from 'express';
import helmet from 'helmet';

import { WEB_RUNTIME_CONFIG } from '~/config/runtime.config';

const cspNonceMiddleware: RequestHandler = (_req, res, next) => {
  res.locals.cspNonce = randomBytes(32).toString('base64');
  next();
};

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const sameOriginMiddleware: RequestHandler = (req, res, next) => {
  const method = (req.method || 'GET').toUpperCase();
  if (!req.path.startsWith(`${WEB_RUNTIME_CONFIG.security.apiBasePath}/`) || !STATE_CHANGING_METHODS.has(method)) {
    return next();
  }

  const fetchSite = req.header('sec-fetch-site');
  if (fetchSite === 'same-origin' || fetchSite === 'none') {
    return next();
  }

  const origin = req.header('origin');
  const host = req.header('host');
  if (origin && host && (origin.includes(host) || origin === 'null')) {
    return next();
  }

  const referer = req.header('referer');
  if (referer && host && referer.includes(host)) {
    return next();
  }

  // 비브라우저 클라이언트 허용
  if (!fetchSite && !origin && !referer) {
    return next();
  }

  res.status(403).json({
    success: false,
    statusCode: 403,
    errorCode: 'CSRF_VALIDATION_FAILED',
    message: 'CSRF validation failed',
  });
};

const permissionsPolicyMiddleware: RequestHandler = (_req, res, next) => {
  res.setHeader('Permissions-Policy', WEB_RUNTIME_CONFIG.security.permissionsPolicy);
  next();
};

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      ...WEB_RUNTIME_CONFIG.security.contentSecurityPolicyDirectives,
      scriptSrc: [
        ...WEB_RUNTIME_CONFIG.security.contentSecurityPolicyDirectives.scriptSrc,
        (_req, res) => `'nonce-${(res as Response).locals.cspNonce}'`,
      ],
    },
  },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'same-origin' },
  frameguard: { action: 'deny' },
  hsts: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

export const securityMiddleware: RequestHandler[] = [
  cspNonceMiddleware,
  helmetMiddleware,
  cookieParser(),
  permissionsPolicyMiddleware,
  sameOriginMiddleware,
];
