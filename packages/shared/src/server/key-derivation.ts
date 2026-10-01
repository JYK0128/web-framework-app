import { hkdfSync } from 'node:crypto';

import { base64UrlToBytes, bytesToBase64Url } from '../common/encoding';

const ROOT_KEY_LENGTH = 32;
const DERIVED_KEY_LENGTH = 32;
const HKDF_SALT = 'web-framework-app/master-key/v1';

/** Derives a purpose-specific 256-bit key from a base64url-encoded random root secret. */
export function deriveSecretKey(rootSecret: string, purpose: string): string {
  const keyMaterial = Buffer.from(base64UrlToBytes(rootSecret));
  if (keyMaterial.length !== ROOT_KEY_LENGTH || bytesToBase64Url(keyMaterial) !== rootSecret) {
    throw new Error('Root secret must encode exactly 32 random bytes');
  }
  if (!purpose.trim()) {
    throw new Error('Key derivation purpose must not be empty');
  }

  const derivedKey = hkdfSync('sha256', keyMaterial, HKDF_SALT, `web-framework-app/${purpose}`, DERIVED_KEY_LENGTH);
  return bytesToBase64Url(new Uint8Array(derivedKey));
}

/** Decodes a derived 256-bit key for use by symmetric cryptographic operations. */
export function decodeSecretKey(key: string): Buffer {
  const bytes = Buffer.from(base64UrlToBytes(key));
  if (bytes.length !== DERIVED_KEY_LENGTH) {
    throw new Error('Secret key must encode exactly 32 bytes');
  }
  return bytes;
}
