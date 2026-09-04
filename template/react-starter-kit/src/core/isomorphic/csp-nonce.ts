import { randomBase64 } from '@pkg/shared/common';
import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';

export function createCspNonce(): string {
  return randomBase64(16);
}

export const getCspNonce = createIsomorphicFn()
  .server(() => {
    const context = getGlobalStartContext() as unknown as { cspNonce?: string } | undefined;
    if (!context?.cspNonce) {
      throw new Error('CSP nonce is unavailable in the server request context');
    }
    return context.cspNonce;
  })
  .client(() => undefined);
