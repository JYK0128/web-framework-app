import { ApplicationError } from '@pkg/shared/common';
import type { ErrorRequestHandler } from 'express';

export const errorMiddleware: ErrorRequestHandler = (error, req, res, _next) => {
  const applicationError = ApplicationError.from(error, {
    code: 'INTERNAL_SERVER_ERROR',
    status: 500,
  });
  const statusCode = applicationError.status ?? 500;

  res.status(statusCode).json({
    success: false,
    statusCode,
    path: req.originalUrl,
    requestId: req.header('x-request-id') ?? '-',
    timestamp: new Date().toISOString(),
    message: statusCode >= 500 ? 'Internal Server Error' : applicationError.message,
    data: null,
    errorCode: applicationError.code,
    details: applicationError.details,
  });
};
