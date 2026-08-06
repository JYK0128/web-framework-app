import { createHmac } from 'node:crypto';

import { compare, hash as bcryptHash } from 'bcrypt';

export async function hash(value: string, saltRounds = 10): Promise<string> {
  return bcryptHash(value, saltRounds);
}

export async function verify(value: string, encodedHash: string): Promise<boolean> {
  if (!encodedHash.startsWith('$2')) return false;

  try {
    return await compare(value, encodedHash);
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
