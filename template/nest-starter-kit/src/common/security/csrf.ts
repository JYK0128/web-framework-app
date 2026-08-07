import { doubleCsrf } from 'csrf-csrf';
import type { Request } from 'express';

import { getCookieOptions } from '#/common/session/cookie.config';
import { env } from '#/env';

export const CSRF_HEADER_NAME = 'x-csrf-token';

const csrfUtilities = doubleCsrf({
  getSecret: () => env.APP_SECRET,
  getSessionIdentifier: (request: Request) => request.sessionID,
  cookieName: env.CSRF_COOKIE_NAME,
  cookieOptions: getCookieOptions(),
  getCsrfTokenFromRequest: (request: Request) => {
    const token = request.headers[CSRF_HEADER_NAME];
    return typeof token === 'string' ? token : undefined;
  },
});

export const { generateCsrfToken, validateRequest } = csrfUtilities;
