import type { EntityDTO } from '@mikro-orm/core';

import type { User } from '#/entities/auth/user.entity';

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
    user: EntityDTO<User> | null
    authLevel: 'password' | 'mfa' | null
    impersonatedBy: string | null
    tokenJti: string | null
    tokenExp: number | null
    clientContext: ClientContext
  }
}
