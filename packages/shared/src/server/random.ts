import { randomBytes } from 'node:crypto';

const DEFAULT_BYTE_LENGTH = 32;

/** Generates a cryptographically secure random base64url string. */
export function randomBase64Url(byteLength = DEFAULT_BYTE_LENGTH): string {
  return randomBytes(byteLength).toString('base64url');
}

/** Generates a cryptographically secure random hexadecimal string. */
export function randomHex(byteLength = DEFAULT_BYTE_LENGTH): string {
  return randomBytes(byteLength).toString('hex');
}
