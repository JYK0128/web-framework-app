import type { Request, Response } from 'express';

import { env } from '~/config/env';

export async function proxyMiddleware(req: Request, res: Response): Promise<void> {
  const url = new URL(req.originalUrl, env.ADMIN_API_URL);

  const HOP_BY_HOP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive']);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP.has(key.toLowerCase())) continue;
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    }
    else {
      headers.set(key, value);
    }
  }

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

    // 백엔드의 Set-Cookie 및 응답 헤더들을 클라이언트에 투명하게 전달
    response.headers.forEach((val, key) => {
      const lower = key.toLowerCase();
      if (lower === 'set-cookie') {
        const rawCookies = typeof response.headers.getSetCookie === 'function'
          ? response.headers.getSetCookie()
          : [val];
        res.setHeader('set-cookie', rawCookies);
      }
      else {
        res.setHeader(key, val);
      }
    });

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
