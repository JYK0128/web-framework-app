import { doubleCsrf } from 'csrf-csrf';
import type { Request } from 'express';

import { cookieNames, getCookieOptions } from '#/common/security/cookie.config';
import { env } from '#/env';

export const CSRF_HEADER_NAME = 'x-csrf-token';

const csrfUtilities = doubleCsrf({
  getSecret: () => env.APP_SECRET,
  getSessionIdentifier: (request: Request) => request.sessionID,
  cookieName: cookieNames.csrf,
  cookieOptions: getCookieOptions(),
  getCsrfTokenFromRequest: (request: Request) => {
    const token = request.headers[CSRF_HEADER_NAME];
    return typeof token === 'string' ? token : undefined;
  },
});

export const { generateCsrfToken, validateRequest } = csrfUtilities;
