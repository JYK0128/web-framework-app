import { ApplicationError } from '@pkg/shared/common';
import { defineEventHandler, getRequestURL } from 'nitro/h3';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default defineEventHandler((event) => {
  const requestUrl = getRequestURL(event);
  const req = event.req as Request;
  const method = (req.method || 'GET').toUpperCase();

  if (!requestUrl.pathname.startsWith('/api/v1/') || !STATE_CHANGING_METHODS.has(method)) {
    return;
  }

  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin') {
    return;
  }

  const origin = req.headers.get('origin');
  if (origin && new URL(origin).origin === requestUrl.origin) {
    return;
  }

  const referer = req.headers.get('referer');
  if (referer) {
    try {
      if (new URL(referer).origin === requestUrl.origin) {
        return;
      }
    }
    catch {
      // Invalid referer
    }
  }

  const body = new ApplicationError({ code: 'CSRF_VALIDATION_FAILED', status: 403 }).toJSON({
    path: `${requestUrl.pathname}${requestUrl.search}`,
    requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
  });
  return Response.json(body, { status: body.statusCode, headers: { 'x-request-id': body.requestId } });
});
