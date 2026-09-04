import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

import { base64UrlToBytes, bytesToBase64Url } from '../common/encoding';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function deriveKey(secret: string, salt: Uint8Array): Buffer {
  if (!secret) {
    throw new Error('Encryption secret must not be empty');
  }

  return scryptSync(secret, salt, KEY_LENGTH);
}

function encode(value: Uint8Array): string {
  return bytesToBase64Url(value);
}

function decode(value: string): Buffer {
  return Buffer.from(base64UrlToBytes(value));
}

/** Encrypts a UTF-8 value with AES-256-GCM. */
export function encrypt(value: string, secret: string): string {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = deriveKey(secret, salt);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [VERSION, encode(salt), encode(iv), encode(authTag), encode(ciphertext)].join('.');
}

/** Decrypts and authenticates a value produced by encrypt(). */
export function decrypt(payload: string, secret: string): string {
  const parts = payload.split('.');
  if (parts.length !== 5) {
    throw new Error('Invalid encrypted payload');
  }

  const [version, encodedSalt, encodedIv, encodedAuthTag, encodedCiphertext] = parts;
  if (version !== VERSION || !encodedSalt || !encodedIv || !encodedAuthTag || !encodedCiphertext) {
    throw new Error('Invalid encrypted payload');
  }

  const salt = decode(encodedSalt);
  const iv = decode(encodedIv);
  const authTag = decode(encodedAuthTag);
  const ciphertext = decode(encodedCiphertext);

  if (salt.length !== SALT_LENGTH || iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid encrypted payload');
  }

  try {
    const key = deriveKey(secret, salt);
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
  catch {
    throw new Error('Unable to decrypt payload');
  }
}
