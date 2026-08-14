import { getGlobalStartContext } from '@tanstack/react-start';

export function createCspNonce() {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }

  return btoa(binary);
}

export function getCspNonce() {
  try {
    const context = getGlobalStartContext() as unknown as { cspNonce?: string } | undefined;
    return context?.cspNonce;
  }
  catch {
    // The request context is unavailable outside a server request.
  }
}
