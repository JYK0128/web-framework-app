import { createFileRoute } from '@tanstack/react-router';
import { assertBodySize, defineEventHandler, getRequestURL, proxyRequest } from 'nitro/h3';

const proxyHandler = defineEventHandler(async (event) => {
  await assertBodySize(event, 2 * 1024 * 1024);
  const backend = process.env.API_BASE_URL;
  if (!backend) throw new Error('API_BASE_URL is required');
  const url = getRequestURL(event);
  const body = ['GET', 'HEAD'].includes(event.req.method) ? undefined : await event.req.arrayBuffer();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    return await proxyRequest(event, new URL(url.pathname + url.search, backend).href, {
      filterHeaders: ['content-length'],
      fetchOptions: { redirect: 'manual', signal: AbortSignal.any([controller.signal, event.req.signal]), body },
    });
  }
  finally {
    // 응답 헤더를 받으면 제한을 해제해 SSE 등 긴 응답 스트림을 유지한다.
    clearTimeout(timeout);
  }
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
