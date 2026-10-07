import { constants, createCipheriv, createDecipheriv, generateKeyPairSync, privateDecrypt, publicEncrypt, randomBytes } from 'node:crypto';

import { base64UrlToBytes, bytesToBase64Url } from '../common/encoding';

const VERSION = 'rsa-oaep-sha256-aes-256-gcm-v1';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const RSA_MODULUS_LENGTH = 3072;

export interface RsaEncryptionKeyPair {
  publicKey: string
  privateKey: string
}

/** Creates an RSA-3072 key pair using PEM encoding. Keep the private key secret. */
export function generateRsaEncryptionKeyPair(): RsaEncryptionKeyPair {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', {
    modulusLength: RSA_MODULUS_LENGTH,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  return { publicKey, privateKey };
}

/** Encrypts a UTF-8 value with a public key using RSA-OAEP and AES-256-GCM. */
export function encryptWithPublicKey(value: string, publicKey: string): string {
  const dataKey = randomBytes(KEY_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', dataKey, iv);
  cipher.setAAD(Buffer.from(VERSION));

  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const wrappedKey = publicEncrypt({
    key: publicKey,
    padding: constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, dataKey);

  return [
    VERSION,
    bytesToBase64Url(wrappedKey),
    bytesToBase64Url(iv),
    bytesToBase64Url(authTag),
    bytesToBase64Url(ciphertext),
  ].join('.');
}

/** Decrypts and authenticates a value produced by encryptWithPublicKey(). */
export function decryptWithPrivateKey(payload: string, privateKey: string): string {
  const parts = payload.split('.');
  if (parts.length !== 5) {
    throw new Error('Invalid asymmetric encrypted payload');
  }

  const [version, encodedWrappedKey, encodedIv, encodedAuthTag, encodedCiphertext] = parts;
  if (version !== VERSION || !encodedWrappedKey || !encodedIv || !encodedAuthTag) {
    throw new Error('Invalid asymmetric encrypted payload');
  }

  const wrappedKey = Buffer.from(base64UrlToBytes(encodedWrappedKey));
  const iv = Buffer.from(base64UrlToBytes(encodedIv));
  const authTag = Buffer.from(base64UrlToBytes(encodedAuthTag));
  const ciphertext = Buffer.from(base64UrlToBytes(encodedCiphertext));

  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Invalid asymmetric encrypted payload');
  }

  try {
    const dataKey = privateDecrypt({
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, wrappedKey);

    if (dataKey.length !== KEY_LENGTH) {
      throw new Error('Invalid asymmetric data key');
    }

    const decipher = createDecipheriv('aes-256-gcm', dataKey, iv);
    decipher.setAAD(Buffer.from(VERSION));
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }
  catch {
    throw new Error('Unable to decrypt asymmetric payload');
  }
}

/** Checks whether a value uses this utility's versioned payload format. */
export function isAsymmetricEncrypted(payload: unknown): boolean {
  if (typeof payload !== 'string') return false;

  const [version, wrappedKey, iv, authTag, ...ciphertextParts] = payload.split('.');
  return version === VERSION
    && Boolean(wrappedKey && iv && authTag)
    && ciphertextParts.length === 1;
}
