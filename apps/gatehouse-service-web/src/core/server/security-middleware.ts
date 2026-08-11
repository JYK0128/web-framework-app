import { createMiddleware } from '@tanstack/react-start';

import { applySecurityHeaders } from './security-header';
import { createSecurityNonce } from './security-nonce';

export const securityMiddleware = createMiddleware().server(async ({ next }) => {
  const nonce = createSecurityNonce();
  const result = await next({ context: { cspNonce: nonce } });

  return {
    ...result,
    response: applySecurityHeaders(result.response, nonce),
  };
});
