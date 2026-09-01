import { createIsomorphicFn, getGlobalStartContext } from '@tanstack/react-start';

export function createCspNonce() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary);
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
