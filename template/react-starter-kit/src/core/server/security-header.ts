/**
 * Content Security Policy (CSP) 외부 허용 도메인 화이트리스트
 *
 * 새로운 외부 라이브러리, CDN, 서드파티 API(결제/본인인증/애널리틱스) 연동 시
 * 아래 배열에 허용할 도메인 URL만 추가하면 모든 CSP 지시문에 자동으로 안전하게 반영됩니다.
 */
export const CSP_WHITELIST = {
  /** 외부 스크립트 로드 허용 도메인 (Google Tag Manager, PortOne SDK, KCP 본인확인) */
  scripts: [
    'https://www.googletagmanager.com',
    'https://cdn.portone.io',
    'https://checkout.portone.io',
    'https://testcert.kcp.co.kr',
    'https://cert.kcp.co.kr',
  ],

  /** API 통신 및 웹소켓 허용 도메인 (Google Analytics, PortOne API, KCP) */
  connect: [
    'https://www.google-analytics.com',
    'https://analytics.google.com',
    'https://api.portone.io',
    'https://checkout-service.prod.iamport.co',
    'https://testcert.kcp.co.kr',
    'https://cert.kcp.co.kr',
  ],

  /** 팝업/아이프레임 임베드 허용 도메인 (PortOne Checkout, KCP 본인확인 창) */
  frames: [
    'https://checkout.portone.io',
    'https://testcert.kcp.co.kr',
    'https://cert.kcp.co.kr',
  ],

  /** 외부 이미지/아이콘 허용 도메인 */
  images: [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://testcert.kcp.co.kr',
    'https://cert.kcp.co.kr',
  ],

  /** 외부 웹폰트 허용 도메인 */
  fonts: [
    'https://testcert.kcp.co.kr',
    'https://cert.kcp.co.kr',
  ],
} as const;

function createScriptSrc(nonce: string) {
  const allowed = CSP_WHITELIST.scripts.join(' ');
  if (import.meta.env.DEV) {
    return `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${allowed}`.trim();
  }
  return `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${allowed}`.trim();
}

function createStyleSrc() {
  return `style-src 'self' 'unsafe-inline'`;
}

function createConnectSrc() {
  const allowed = CSP_WHITELIST.connect.join(' ');
  if (import.meta.env.DEV) {
    return `connect-src 'self' ws: wss: http: https: ${allowed}`.trim();
  }
  return `connect-src 'self' ${allowed}`.trim();
}

function createWorkerSrc() {
  if (import.meta.env.DEV) {
    return `worker-src 'self' blob:`;
  }
  return `worker-src 'self'`;
}

function createFrameSrc() {
  const allowed = CSP_WHITELIST.frames.join(' ');
  return allowed ? `frame-src 'self' ${allowed}`.trim() : `frame-src 'self'`;
}

function createImgSrc() {
  const allowed = CSP_WHITELIST.images.join(' ');
  return allowed ? `img-src 'self' data: blob: ${allowed}`.trim() : `img-src 'self' data: blob:`;
}

function createFontSrc() {
  const allowed = CSP_WHITELIST.fonts.join(' ');
  return allowed ? `font-src 'self' data: ${allowed}`.trim() : `font-src 'self' data:`;
}

function createContentSecurityPolicy(nonce: string) {
  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    createImgSrc(),
    createFrameSrc(),
    createFontSrc(),
    createStyleSrc(),
    createScriptSrc(nonce),
    createConnectSrc(),
    createWorkerSrc(),
  ]
    .filter(Boolean)
    .join('; ');
}

export function applySecurityHeaders(response: Response, nonce: string) {
  const headers = new Headers(response.headers);

  // Restricts script/style/image/font/network sources and reduces XSS impact.
  headers.set('Content-Security-Policy', createContentSecurityPolicy(nonce));
  // Prevents MIME sniffing so browsers do not treat uploaded or served files as executable content.
  headers.set('X-Content-Type-Options', 'nosniff');
  // Blocks embedding this app in frames and helps prevent clickjacking.
  headers.set('X-Frame-Options', 'DENY');
  // Limits how much referrer information is sent to other origins.
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Disables browser access to camera, microphone, and geolocation APIs by default.
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Allows popups (OAuth, identity verification) to maintain communication with top-level context.
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  // Restricts other origins from reading resources served by this app.
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
