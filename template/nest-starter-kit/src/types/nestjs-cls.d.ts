import type { AuthPrincipal } from '#/common/security/auth-token.types';

declare module 'nestjs-cls' {
  export type ClientContext = {
    ipAddress: string | null
    userAgent: string | null
    referer: string | null
    origin: string | null
    acceptLanguage: string | null
    secChUa: string | null
    secChUaMobile: string | null
    secChUaPlatform: string | null
    doNotTrack: string | null
  };

  export interface ClsStore {
    requestId: string
    user: AuthPrincipal | null
    tokenFamilyId: string | null
    clientContext: ClientContext
  }
}
