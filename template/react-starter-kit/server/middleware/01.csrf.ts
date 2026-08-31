import { defineEventHandler, HTTPError } from 'nitro/h3';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export default defineEventHandler((event) => {
  const requestUrl = event.url;
  const method = event.req.method.toUpperCase();

  if (!requestUrl.pathname.startsWith('/api/v1/') || !STATE_CHANGING_METHODS.has(method)) return;

  const fetchSite = event.req.headers.get('sec-fetch-site');
  if (fetchSite !== null) {
    if (fetchSite === 'same-origin') return;
    throw HTTPError.status(403, 'CSRF validation failed');
  }

  const origin = event.req.headers.get('origin');
  if (origin !== null) {
    if (origin === requestUrl.origin) return;
    throw HTTPError.status(403, 'CSRF validation failed');
  }

  const referer = event.req.headers.get('referer');
  if (referer !== null) {
    try {
      if (new URL(referer).origin === requestUrl.origin) return;
    }
    catch {
      // Invalid Referer values are rejected below.
    }
  }

  throw HTTPError.status(403, 'CSRF validation failed');
});
