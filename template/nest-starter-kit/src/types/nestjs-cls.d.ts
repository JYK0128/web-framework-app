import type { User } from '#/entities/auth/user.entity';

declare module 'nestjs-cls' {
  export type RequestTrackingContext = {
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
    sessionId: string | null
    user: Omit<User, 'termAgreements'> | null
    isTwoFactorAuthenticated: boolean
    tracking: RequestTrackingContext
  }
}
