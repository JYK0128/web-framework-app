import { randomBytes } from 'node:crypto';

import handler, { createServerEntry } from '@tanstack/react-start/server-entry';

export default createServerEntry({
  async fetch(request, options) {
    const nonce = randomBytes(32).toString('base64');
    const response = await handler.fetch(request, { ...options, context: { ...options?.context, nonce } });
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (response.headers.get('content-type')?.includes('text/html')) {
      const scriptPolicy = process.env.NODE_ENV === 'development' ? '\'unsafe-inline\'' : `'nonce-${nonce}'`;
      response.headers.set('Cache-Control', 'private, no-store');
      response.headers.set('Content-Security-Policy', `default-src 'self'; script-src 'self' ${scriptPolicy}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws:; worker-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`);
    }
    return response;
  },
});
