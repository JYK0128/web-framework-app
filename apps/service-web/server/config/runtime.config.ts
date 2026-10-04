import { API_BASE_PATH } from '@pkg/shared/common';

export const WEB_RUNTIME_CONFIG = {
  request: {
    bodyMaxSizeBytes: 1 * 1024 * 1024,
    trustProxy: true,
  },
  shutdownTimeoutMilliseconds: 10_000,
  healthCheckTimeoutMilliseconds: 2_000,
  proxyResponseHeaderTimeoutMilliseconds: 30_000,
  security: {
    apiBasePath: API_BASE_PATH,
    permissionsPolicy: 'camera=(), microphone=(), geolocation=()',
    contentSecurityPolicyDirectives: {
      defaultSrc: ['\'self\''],
      baseUri: ['\'self\''],
      frameAncestors: ['\'none\''],
      objectSrc: ['\'none\''],
      imgSrc: ['\'self\'', 'data:', 'blob:'],
      styleSrc: ['\'self\'', '\'unsafe-inline\''],
      scriptSrc: ['\'self\''],
      connectSrc: ['\'self\'', 'ws:'],
      workerSrc: ['\'self\''],
    },
  },
} as const;
