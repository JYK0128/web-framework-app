import type { AuthPrincipal } from '#http/types/principal.type';

// nestjs-cls ClsStore — 요청 스코프 유저 컨텍스트
declare module 'nestjs-cls' {
  interface ClsStore {
    principal: AuthPrincipal | undefined
    requestId: string | undefined
    ipAddress: string | null | undefined
    userAgent: string | null | undefined
  }
}

export {};
