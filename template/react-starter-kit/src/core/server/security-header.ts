function createScriptSrc(nonce: string) {
  if (import.meta.env.DEV) {
    return `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://apis.google.com`;
  }
  return `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.google.com https://www.gstatic.com https://apis.google.com`;
}

function createStyleSrc() {
  return `style-src 'self' 'unsafe-inline'`;
}

function createConnectSrc() {
  if (import.meta.env.DEV) {
    return `connect-src 'self' ws: wss: http: https: https://identitytoolkit.googleapis.com https://securetoken.googleapis.com`;
  }
  return `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com`;
}

function createWorkerSrc() {
  if (import.meta.env.DEV) {
    return `worker-src 'self' blob:`;
  }
  return `worker-src 'self'`;
}

function createContentSecurityPolicy(nonce: string) {
  const scriptSrc = createScriptSrc(nonce);
  const styleSrc = createStyleSrc();
  const connectSrc = createConnectSrc();
  const workerSrc = createWorkerSrc();
  return [
    `default-src 'self'`,
    `base-uri 'self'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `img-src 'self' data: blob: https://www.google.com https://www.gstatic.com`,
    `frame-src 'self' https://www.google.com https://www.gstatic.com https://recaptcha.google.com`,
    `font-src 'self' data:`,
    styleSrc,
    scriptSrc,
    connectSrc,
    workerSrc,
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
  // Keeps the top-level browsing context isolated from other origins.
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // Restricts other origins from reading resources served by this app.
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
