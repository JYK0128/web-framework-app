import { createFileRoute } from '@tanstack/react-router';
import { assertBodySize, defineEventHandler } from 'nitro/h3';

import { handleSessionRequest } from '#/lib/session';

const proxyHandler = defineEventHandler(async (event) => {
  await assertBodySize(event, 2 * 1024 * 1024);
  return handleSessionRequest(event.req);
});

function proxy({ request }: { request: Request }) {
  // H3의 fetch는 표준 Response를 반환하지만 헤더 타입을 별도로 정의한다.
  return proxyHandler.fetch(request) as Promise<Response>;
}

export const Route = createFileRoute('/api/$')({
  server: {
    handlers: {
      GET: proxy,
      HEAD: proxy,
      POST: proxy,
      PUT: proxy,
      PATCH: proxy,
      DELETE: proxy,
      OPTIONS: proxy,
    },
  },
});
