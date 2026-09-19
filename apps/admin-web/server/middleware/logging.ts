import type { RequestHandler } from 'express';

const STATIC_EXTENSION_REGEX = /\.(?:js|css|map|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot|webp)$/i;

export const loggingMiddleware: RequestHandler = (req, res, next) => {
  const requestId = req.header('x-request-id') ?? '-';

  const startedAt = Date.now();

  const onFinish = () => {
    const duration = Date.now() - startedAt;
    const { statusCode } = res;

    // 정적 자산 정상 응답(2xx/3xx)은 콘솔 노이즈 방지를 위해 스킵
    if (statusCode < 400 && STATIC_EXTENSION_REGEX.test(req.path)) {
      return;
    }

    const message = `[BFF] ${req.method} ${req.originalUrl} ${statusCode} (${duration}ms) [requestId=${requestId}]`;

    if (statusCode >= 500) {
      console.error(message);
    }
    else if (statusCode >= 400) {
      console.warn(message);
    }
    else {
      console.log(message);
    }
  };

  res.once('finish', onFinish);
  next();
};
