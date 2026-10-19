import { createHash, createHmac } from 'node:crypto';

import { decodeSecretKey } from './key-derivation';

/** 동일한 입력에 대해 동일한 SHA-256 hex 해시를 반환합니다. */
export function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/**
 * PII(이메일 등) 감사 로그 조회를 위한 검색 가능한 결정론적 HMAC-SHA256 해시 생성 함수
 */
export function hashWithSecret(value: string, secret: string): string {
  return createHmac('sha256', decodeSecretKey(secret)).update(value).digest('hex');
}
