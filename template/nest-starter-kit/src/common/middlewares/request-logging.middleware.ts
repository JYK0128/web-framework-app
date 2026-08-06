import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { maskUrl } from '@pkg/shared';
import { hmac } from '@pkg/shared/server';
import type { NextFunction, Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { env } from '#/env';

// 법적/규제(개인정보보호법, ISMS-P 등) 감사 증빙 대상 [메서드, URL패턴]
const AUDIT_PATTERNS: readonly (readonly [string, string])[] = [
  // 회원 계정 생애주기 (가입 / 탈퇴)
  ['POST', '/auth/register'],
  ['POST', '/auth/unregister'],

  // 약관 동의 (로그인 챌린지 / 마이페이지)
  ['POST', '/auth/terms/agree'],
  ['POST', '/terms/agree'],

  // 2단계 인증 (2FA 설정 변경)
  ['POST', '/auth/2fa/turn-on'],
  ['POST', '/auth/2fa/turn-off'],

  // 소셜 계정 연동 / 해제
  ['POST', '/auth/link-account'],
  ['POST', '/auth/unlink-account'],
];

function parseResponseBody(body: unknown): unknown {
  if (body === undefined || body === null || body === '') return '(empty)';
  if (typeof body !== 'string') return body;
  try {
    return JSON.parse(body);
  }
  catch {
    return body;
  }
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly cls: ClsService) {}

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = Date.now();
    let responseBody: unknown;

    const originalSend = response.send.bind(response);
    response.send = function (chunk: unknown): Response {
      responseBody = Buffer.isBuffer(chunk) ? chunk.toString('utf-8') : chunk;
      return originalSend(chunk);
    };

    response.on('finish', () => {
      this.handleFinish(request, response, startedAt, responseBody);
    });

    next();
  }

  private handleFinish(request: Request, response: Response, startedAt: number, responseBody: unknown): void {
    const duration = Date.now() - startedAt;
    const { statusCode } = response;
    const url = maskUrl(request.originalUrl);

    const isError = statusCode >= 400;
    const isAudit = AUDIT_PATTERNS.some(
      ([method, path]) => request.method === method && url.includes(path),
    );

    // 운영 환경에서는 에러(>=400) 또는 법적 감사 대상 패턴만 로깅
    if (env.NODE_ENV === 'production' && !isError && !isAudit) {
      return;
    }

    const requestId = (this.cls.get('requestId')) ?? '-';
    const user = this.cls.get('user');

    const reqBody = request.body as Record<string, unknown> | undefined;
    const hasReqBody = Boolean(reqBody) && Object.keys(reqBody ?? {}).length > 0;

    const meta = {
      requestId,
      method: request.method,
      url,
      isAudit,
      statusCode,
      duration,
      emailHash: user?.email ? hmac(user.email, env.APP_SECRET) : null,
      request: hasReqBody ? reqBody : null,
      response: parseResponseBody(responseBody),
    };

    const message = `${request.method} ${url} ${statusCode} (${duration}ms)`;

    if (isError) {
      this.logger.error(message, meta);
    }
    else {
      this.logger.log(message, meta);
    }
  }
}
