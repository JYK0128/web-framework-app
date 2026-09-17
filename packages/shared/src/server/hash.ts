import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const KEY_LEN = 64;
const SCRYPT_PREFIX = 's2';

/** 비밀번호 해싱 DoS 방지를 위한 최대 입력 바이트 */
export const PASSWORD_MAX_BYTES = 256;

export async function hash(value: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(value, salt, KEY_LEN)) as Buffer;

  return `${SCRYPT_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
}

export async function verify(value: string, encodedHash: string): Promise<boolean> {
  const parts = encodedHash.split('$');
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) {
    return false;
  }

  const [, salt, expectedHex] = parts;
  try {
    const expectedBuffer = Buffer.from(expectedHex, 'hex');
    const derivedKey = (await scryptAsync(value, salt, expectedBuffer.length)) as Buffer;
    if (expectedBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, derivedKey);
  }
  catch {
    return false;
  }
}

/**
 * PII(이메일 등) 감사 로그 조회를 위한 검색 가능한 결정론적 HMAC-SHA256 해시 생성 함수
 */
export function hmac(value: string, secret: string): string {
  return createHmac('sha256', secret).update(value).digest('hex');
}
