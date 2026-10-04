import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { base64UrlToBytes, bytesToBase64Url } from '../common/encoding';
import { decodeSecretKey } from './key-derivation';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v2';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function encode(value: Uint8Array): string {
  return bytesToBase64Url(value);
}

function decode(value: string): Buffer {
  return Buffer.from(base64UrlToBytes(value));
}

/** Encrypts a UTF-8 value with AES-256-GCM using a derived 256-bit key. */
export function encrypt(value: string, secret: string): string {
  const iv = randomBytes(IV_LENGTH);
  const key = decodeSecretKey(secret);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, encode(iv), encode(authTag), encode(ciphertext)].join('.');
}

/** Decrypts and authenticates a value produced by encrypt(). */
export function decrypt(payload: string, secret: string): string {
  const parts = payload.split('.');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted payload');
  }

  const [version, encodedIv, encodedAuthTag, encodedCiphertext] = parts;
  if (version !== VERSION || !encodedIv || !encodedAuthTag) {
    throw new Error('Invalid encrypted payload');
  }

  const iv = decode(encodedIv);
  const authTag = decode(encodedAuthTag);
  const ciphertext = decode(encodedCiphertext);

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted payload');
  }

  try {
    const key = decodeSecretKey(secret);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
  catch {
    throw new Error('Unable to decrypt payload');
  }
}

/** Checks whether a value matches the AES-256-GCM encrypted payload format. */
export function isEncrypted(payload: unknown): boolean {
  if (typeof payload !== 'string') return false;
  const parts = payload.split('.');
  return parts.length === 4
    && parts[0] === VERSION
    && Boolean(parts[1] && parts[2]);
}
