import { ApplicationError } from '@pkg/shared/common';
import { createI18nRequestMiddleware } from '@pkg/web-core/i18n/request-middleware';
import type { Register } from '@tanstack/react-router';
import { createCsrfMiddleware, createStart } from '@tanstack/react-start';

import { i18nOptions } from './i18n/config';

const i18nMiddleware = createI18nRequestMiddleware(i18nOptions);

const csrfMiddleware = createCsrfMiddleware<Register, [typeof i18nMiddleware]>({
  filter: ({ request }) => new URL(request.url).pathname.startsWith('/api/')
    && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method),
  secFetchSite: ['same-origin', 'none'],
  allowRequestsWithoutOriginCheck: false,
  failureResponse: ({ request, context }) => {
    const url = new URL(request.url);
    const body = new ApplicationError({ code: 'CSRF_VALIDATION_FAILED', status: 403 }).toJSON({
      path: `${url.pathname}${url.search}`,
      requestId: request.headers.get('x-request-id') || crypto.randomUUID(),
      i18n: context.i18n,
    });
    return Response.json(body, { status: body.statusCode, headers: { 'x-request-id': body.requestId } });
  },
});

export const startInstance = createStart(() => ({
  requestMiddleware: [i18nMiddleware, csrfMiddleware],
}));
