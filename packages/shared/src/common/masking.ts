import maskdata from 'maskdata';

const { maskJwt, maskPassword, maskPhone: maskPhoneLib, maskStringV2 } = maskdata;

/**
 * PII 및 민감정보 마스킹 유틸리티 모듈 (maskdata 기반)
 */

/**
 * 이메일 마스킹 (maskdata 기반: 아이디 앞 2자리 유지)
 * @example honggildong@domain.com -> ho***@domain.com
 */
export function maskEmail(emailStr: string): string {
  if (!emailStr || !emailStr.includes('@')) return emailStr || '';
  const [local, domain] = emailStr.split('@');
  if (local.length <= 2) {
    return `${local[0] || ''}***@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * 전화번호 마스킹 (maskdata 기반: 앞 3자리, 뒤 4자리 유지)
 * @example 01012345678 -> 010****5678
 */
export function maskPhone(phoneStr: string): string {
  if (!phoneStr) return '';
  return maskPhoneLib(phoneStr, {
    maskWith: '*',
    unmaskedEndDigits: 4,
    unmaskedStartDigits: 3,
  });
}

/**
 * 성명(이름) 마스킹 (maskdata 기반: 앞 1자리, 뒤 1자리 유지)
 * @example 홍길동 -> 홍*동
 */
export function maskName(nameStr: string): string {
  if (!nameStr) return '';
  if (nameStr.length <= 2) {
    return `${nameStr[0]}*`;
  }
  return maskStringV2(nameStr, {
    maskWith: '*',
    unmaskedEndCharacters: 1,
    unmaskedStartCharacters: 1,
  });
}

const SECRET_KEYWORDS = ['password', 'secret', 'code', 'otp', 'cvv'];
const TOKEN_KEYWORDS = ['token', 'authorization', 'apikey'];
const EMAIL_KEYWORDS = ['email'];
const PHONE_KEYWORDS = ['phone', 'mobile'];
const NAME_KEYWORDS = ['name', 'username', 'ssn', 'creditcard'];

/** 민감 키워드가 포함되어 있더라도 마스킹에서 제외할 정확한 키 목록 */
const EXCLUDED_KEYS = new Set([
  'statuscode',    // HTTP 상태코드
  'errorcode',     // 에러 분류 코드
  'currencycode',  // 통화 코드
  'countrycode',   // 국가 코드
  'languagecode',  // 언어 코드
  'codename',      // 코드 명칭
  'displayname',   // 표시용 이름 (사용자 실명 아님)
]);

function maskFieldValue(key: string, val: unknown): unknown {
  const lKey = key.toLowerCase();

  // 예외 키는 마스킹하지 않음
  if (EXCLUDED_KEYS.has(lKey)) return val;

  // 1. 비밀번호 & 비밀키
  if (SECRET_KEYWORDS.some((kw) => lKey.includes(kw))) {
    return typeof val === 'string' ? maskPassword(val, { fixedOutputLength: 3, maskWith: '*' }) : '***';
  }

  // 2. 토큰 및 API Key
  if (TOKEN_KEYWORDS.some((kw) => lKey.includes(kw))) {
    return typeof val === 'string' ? maskJwt(val, { maskWith: '*', maxMaskedCharacters: 3 }) : '***';
  }

  // 3. PII (이메일, 전화번호, 이름 등)
  if (typeof val === 'string') {
    if (EMAIL_KEYWORDS.some((kw) => lKey.includes(kw))) return maskEmail(val);
    if (PHONE_KEYWORDS.some((kw) => lKey.includes(kw))) return maskPhone(val);
    if (NAME_KEYWORDS.some((kw) => lKey.includes(kw))) return maskName(val);
  }

  return val;
}

/**
 * 중첩(Nested) 객체 및 배열 재귀 마스킹 처리기
 */
export function maskObject<T extends object>(data: T): T {
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map((item) => (typeof item === 'object' && item !== null ? maskObject(item) : item)) as unknown as T;
  }

  const maskedObj = { ...data } as Record<string, unknown>;

  for (const [key, val] of Object.entries(maskedObj)) {
    if (val === null || val === undefined) continue;

    if (typeof val === 'object') {
      maskedObj[key] = maskObject(val);
    }
    else {
      maskedObj[key] = maskFieldValue(key, val);
    }
  }

  return maskedObj as T;
}

/**
 * URL QueryString (예: /api/auth/reset?token=eyJ...&email=user@domain.com) 자동 마스킹
 */
export function maskUrl(urlStr: string): string {
  if (!urlStr || !urlStr.includes('?')) return urlStr;

  const qIndex = urlStr.indexOf('?');
  const pathname = urlStr.slice(0, qIndex);
  const queryString = urlStr.slice(qIndex + 1);

  if (!queryString || !queryString.includes('=')) return urlStr;

  const params = new URLSearchParams(queryString);
  const paramObj: Record<string, string> = {};

  for (const [key, value] of params.entries()) {
    paramObj[key] = value;
  }

  const maskedObj = maskObject(paramObj);
  const maskedPairs: string[] = [];

  for (const [key, value] of Object.entries(maskedObj)) {
    maskedPairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value)).replace(/%40/g, '@')}`);
  }

  return `${pathname}?${maskedPairs.join('&')}`;
}

function tryParseAndMaskJson(trimmed: string): string | null {
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    const parsed = JSON.safeParse<unknown>(trimmed);
    if (typeof parsed === 'object' && parsed !== null) {
      return JSON.stringify(maskObject(parsed));
    }
  }
  return null;
}

/**
 * 범용 데이터(객체, 배열, JSON 문자열, URL QueryString 등) 통합 마스킹 함수
 */
export function maskData(data: unknown): unknown {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    const trimmed = data.trim();
    const jsonResult = tryParseAndMaskJson(trimmed);
    if (jsonResult !== null) return jsonResult;

    if (trimmed.includes('?') && trimmed.includes('=')) {
      return maskUrl(trimmed);
    }
    return data;
  }

  if (typeof data === 'object') {
    return maskObject(data);
  }

  return data;
}

/**
 * 통합 단일 PII 마스킹 처리기
 */
export function maskPII(val: string, rawKey: string): string {
  if (rawKey.includes('email') || val.includes('@')) {
    return maskEmail(val);
  }
  if (rawKey.includes('phone') || rawKey.includes('mobile') || /^01[016789]/.test(val.replace(/\D/g, ''))) {
    return maskPhone(val);
  }
  if (rawKey.includes('name')) {
    return maskName(val);
  }
  return maskStringV2(val, {
    maskWith: '*',
    unmaskedStartCharacters: 2,
  });
}
