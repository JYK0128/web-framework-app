/**
 * 문자열을 UTF-8 바이트(Uint8Array)로 인코딩 (Isomorphic)
 */
export function encodeUtf8(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

/**
 * UTF-8 바이트(Uint8Array | ArrayBuffer)를 문자열로 디코딩 (Isomorphic)
 */
export function decodeUtf8(buffer?: Uint8Array | ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Uint8Array 바이트를 Base64 문자열로 변환 (Isomorphic)
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCodePoint(byte);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 Uint8Array 바이트로 변환 (Isomorphic)
 */
export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return bytes;
}

/**
 * 문자열을 Base64로 인코딩 (UTF-8 호환)
 */
export function stringToBase64(text: string): string {
  return bytesToBase64(encodeUtf8(text));
}

/**
 * Base64를 문자열로 디코딩 (UTF-8 호환)
 */
export function base64ToString(base64: string): string {
  return decodeUtf8(base64ToBytes(base64));
}

/**
 * Uint8Array 바이트를 Base64URL 문자열로 변환 (Isomorphic)
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/={1,2}$/, '');
}

/**
 * Base64URL 문자열을 Uint8Array 바이트로 변환 (Isomorphic)
 */
export function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url
    .replaceAll('-', '+')
    .replaceAll('_', '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return base64ToBytes(base64);
}

/**
 * 문자열을 Base64URL로 인코딩 (UTF-8 호환)
 */
export function stringToBase64Url(text: string): string {
  return bytesToBase64Url(encodeUtf8(text));
}

/**
 * Base64URL을 문자열로 디코딩 (UTF-8 호환)
 */
export function base64UrlToString(base64url: string): string {
  return decodeUtf8(base64UrlToBytes(base64url));
}

/**
 * Uint8Array 바이트를 16진수(Hex) 문자열로 변환 (Isomorphic)
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * 16진수(Hex) 문자열을 Uint8Array 바이트로 변환 (Isomorphic)
 */
export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.length % 2 === 0 ? hex : `0${hex}`;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 문자열을 16진수(Hex)로 인코딩 (UTF-8 호환)
 */
export function stringToHex(text: string): string {
  return bytesToHex(encodeUtf8(text));
}

/**
 * 16진수(Hex)를 문자열로 디코딩 (UTF-8 호환)
 */
export function hexToString(hex: string): string {
  return decodeUtf8(hexToBytes(hex));
}
