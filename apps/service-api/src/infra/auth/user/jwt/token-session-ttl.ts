import { TimeUtil } from '@pkg/shared/common';

import { SECURITY_CONFIG } from '#/app.config';

export type TokenSessionTtls = {
  sessionTtlSeconds: number
  refreshTokenRetentionSeconds: number
};

export function getTokenSessionTtls(rememberMe: boolean): TokenSessionTtls {
  const sessionTtlSeconds = rememberMe
    ? TimeUtil.s.day(SECURITY_CONFIG.token.rememberMeDays)
    : TimeUtil.s.minute(SECURITY_CONFIG.token.refreshIdleTimeoutMinutes);
  const accessTokenTtlSeconds = TimeUtil.s.minute(SECURITY_CONFIG.token.accessTokenTtlMinutes);
  return {
    sessionTtlSeconds,
    refreshTokenRetentionSeconds: sessionTtlSeconds + accessTokenTtlSeconds + 60,
  };
}
