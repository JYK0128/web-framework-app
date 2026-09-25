import type { Request, Response as ExpressResponse } from 'express';

import { env } from '~/config/env';

const HOP_BY_HOP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive']);

function forwardRequestHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    }
    else headers.set(key, value);
  }
  return headers;
}

function forwardResponseHeaders(response: globalThis.Response, res: ExpressResponse): void {
  response.headers.forEach((val, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const rawCookies = typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [val];
      res.setHeader('set-cookie', rawCookies);
    }
    else res.setHeader(key, val);
  });
}

async function streamResponse(response: globalThis.Response, res: ExpressResponse): Promise<void> {
  res.status(response.status);
  res.flushHeaders();
  if (!response.body) {
    res.end();
    return;
  }
  const reader = response.body.getReader() as ReadableStreamDefaultReader<Uint8Array>;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      res.write(Buffer.from(result.value));
    }
  }
  finally {
    reader.releaseLock();
    res.end();
  }
}

export async function proxyMiddleware(req: Request, res: ExpressResponse): Promise<void> {
  const url = new URL(req.originalUrl, env.SERVICE_API_URL);

  const headers = forwardRequestHeaders(req);

  const isBodyAllowed = req.method !== 'GET' && req.method !== 'HEAD';
  let bodyData: string | undefined;
  if (isBodyAllowed) {
    bodyData = JSON.stringify(req.body ?? {});
    headers.set('content-type', 'application/json');
  }

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: bodyData,
      redirect: 'manual',
    });

    forwardResponseHeaders(response, res);

    if (response.headers.get('content-type')?.startsWith('text/event-stream')) {
      await streamResponse(response, res);
      return;
    }

    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  }
  catch (error) {
    console.error('Proxy error connecting to service-api:', error);
    res.status(502).json({
      success: false,
      statusCode: 502,
      errorCode: 'BAD_GATEWAY',
      message: '백엔드 서비스(service-api)에 연결할 수 없습니다.',
    });
  }
}
