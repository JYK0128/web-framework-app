import { createFileRoute } from '@tanstack/react-router';

import { handleSessionRequest } from '#/lib/session';

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: ({ request }) => handleSessionRequest(request),
      HEAD: ({ request }) => handleSessionRequest(request),
      POST: ({ request }) => handleSessionRequest(request),
      PUT: ({ request }) => handleSessionRequest(request),
      PATCH: ({ request }) => handleSessionRequest(request),
      DELETE: ({ request }) => handleSessionRequest(request),
      OPTIONS: ({ request }) => handleSessionRequest(request),
    },
  },
});
