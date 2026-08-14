import { createMiddleware } from '@tanstack/react-start';

import { createCspNonce } from './csp-nonce';
import { applySecurityHeaders } from './security-header';

export const securityMiddleware = createMiddleware().server(async ({ next }) => {
  const nonce = createCspNonce();
  const result = await next({ context: { cspNonce: nonce } });

  return {
    ...result,
    response: applySecurityHeaders(result.response, nonce),
  };
});
