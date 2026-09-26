import type { Request, Response } from 'express';

import { env } from '~/config/env';

const HOP_BY_HOP_HEADERS = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive']);

function createProxyHeaders(req: Request): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP_HEADERS.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    }
    else {
      headers.set(key, value);
    }
  }
  return headers;
}

async function createProxyBody(req: Request, headers: Headers): Promise<string | Buffer | undefined> {
  const isBodyAllowed = req.method !== 'GET' && req.method !== 'HEAD';
  if (!isBodyAllowed) return undefined;

  const contentType = req.headers['content-type'] ?? '';
  if (contentType.includes('application/json')) {
    headers.set('content-type', 'application/json');
    return JSON.stringify(req.body ?? {});
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req as AsyncIterable<Buffer | string>) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
}

function forwardProxyHeaders(response: globalThis.Response, res: Response): void {
  response.headers.forEach((val, key) => {
    if (key.toLowerCase() !== 'set-cookie') {
      res.setHeader(key, val);
      return;
    }
    const rawCookies = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [val];
    res.setHeader('set-cookie', rawCookies);
  });
}

export async function proxyMiddleware(req: Request, res: Response): Promise<void> {
  const url = new URL(req.originalUrl, env.ADMIN_API_URL);
  const headers = createProxyHeaders(req);
  const bodyData = await createProxyBody(req, headers);

  try {
    const response = await fetch(url, {
      method: req.method,
      headers,
      body: bodyData,
      redirect: 'manual',
    });

    // 백엔드의 Set-Cookie 및 응답 헤더들을 클라이언트에 투명하게 전달
    forwardProxyHeaders(response, res);
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  }
  catch (error) {
    console.error('Proxy error connecting to admin-api:', error);
    res.status(502).json({
      success: false,
      statusCode: 502,
      errorCode: 'BAD_GATEWAY',
      message: '백엔드 서비스(admin-api)에 연결할 수 없습니다.',
    });
  }
}
