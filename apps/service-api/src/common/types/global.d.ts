import type { JWTPayload } from 'jose';

// jose JWTPayload 확장 — 커스텀 클레임 필드
declare module 'jose' {
  interface JWTPayload {
    roles?: string[]
    permissions?: string[]
  }
}

// nestjs-cls ClsStore — 요청 스코프 유저 컨텍스트
declare module 'nestjs-cls' {
  interface ClsStore {
    user: JWTPayload | undefined
  }
}

export {};
