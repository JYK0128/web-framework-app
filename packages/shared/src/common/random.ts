import { bytesToBase64, bytesToBase64Url, bytesToHex } from './encoding';

const DEFAULT_BYTE_LENGTH = 32;

/**
 * Node.js와 브라우저 환경 모두에서 동작하는 암호학적 안전 난수 바이트 생성
 */
export function randomBytes(byteLength = DEFAULT_BYTE_LENGTH): Uint8Array {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Base64 인코딩된 안전한 난수 문자열 생성 (CSP Nonce 등에 사용)
 */
export function randomBase64(byteLength = 16): string {
  return bytesToBase64(randomBytes(byteLength));
}

/**
 * Base64URL 인코딩된 난수 문자열 생성 (URL/세션/토큰 등에 사용)
 */
export function randomBase64Url(byteLength = DEFAULT_BYTE_LENGTH): string {
  return bytesToBase64Url(randomBytes(byteLength));
}

/**
 * 16진수(Hex) 난수 문자열 생성 (State/Challenge 등에 사용)
 */
export function randomHex(byteLength = DEFAULT_BYTE_LENGTH): string {
  return bytesToHex(randomBytes(byteLength));
}
