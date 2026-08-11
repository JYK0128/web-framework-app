import { getGlobalStartContext } from '@tanstack/react-start';

export function createSecurityNonce() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary);
}

export function getSecurityNonce() {
  try {
    const context = getGlobalStartContext();
    return context?.cspNonce;
  }
  catch {
    // The request context is unavailable outside a server request.
  }
}
