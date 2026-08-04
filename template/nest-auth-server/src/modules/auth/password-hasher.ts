import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

function deriveKey(password: string, salt: Buffer, keyLength: number, options: { N: number, r: number, p: number, maxmem: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = await deriveKey(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);

  return [
    'scrypt',
    String(SCRYPT_OPTIONS.N),
    String(SCRYPT_OPTIONS.r),
    String(SCRYPT_OPTIONS.p),
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$');
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, n, r, p, encodedSalt, encodedKey] = encodedHash.split('$');
  if (algorithm !== 'scrypt' || !n || !r || !p || !encodedSalt || !encodedKey) return false;

  const cost = Number(n);
  const blockSize = Number(r);
  const parallelization = Number(p);
  if (!Number.isSafeInteger(cost) || cost < 1_024 || cost > 1_048_576 || (cost & (cost - 1)) !== 0) return false;
  if (!Number.isSafeInteger(blockSize) || blockSize < 1 || blockSize > 64) return false;
  if (!Number.isSafeInteger(parallelization) || parallelization < 1 || parallelization > 16) return false;

  const salt = Buffer.from(encodedSalt, 'base64url');
  const expectedKey = Buffer.from(encodedKey, 'base64url');
  if (expectedKey.length !== KEY_LENGTH || salt.length === 0) return false;

  const derivedKey = await deriveKey(password, salt, expectedKey.length, {
    N: cost,
    r: blockSize,
    p: parallelization,
    maxmem: SCRYPT_OPTIONS.maxmem,
  });

  return timingSafeEqual(expectedKey, derivedKey);
}
