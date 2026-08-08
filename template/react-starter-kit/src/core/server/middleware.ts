import { createCsrfMiddleware } from '@tanstack/react-start';

import { i18nMiddleware } from './i18n-middleware';
import { securityMiddleware } from './security-middleware';

// Blocks unsafe server function requests that do not satisfy CSRF checks.
const csrfMiddleware = createCsrfMiddleware({
  filter: ({ handlerType, request }) =>
    handlerType === 'serverFn' && request.method !== 'GET' && request.method !== 'HEAD',
});

export const startMiddlewares = [
  csrfMiddleware,
  i18nMiddleware,
  securityMiddleware,
] as const;
