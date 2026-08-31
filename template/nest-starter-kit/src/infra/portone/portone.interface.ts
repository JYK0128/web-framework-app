import type { Gender } from '#/common/constants/identity.constants';

export interface PortOneVerifiedCustomer {
  name: string
  phoneNumber: string
  birthDate?: string
  gender?: Gender
  ci?: string
  di?: string
}

export interface PortOneVerifiedIdentity extends PortOneVerifiedCustomer {
  id: string
}

export const PORTONE_MODULE_OPTIONS = Symbol('PORTONE_MODULE_OPTIONS');

export interface PortOneModuleOptions {
  apiSecret: string
  /**
   * 단일 HTTP 요청 타임아웃 (ms 단위, 기본값: 5000)
   */
  timeoutMs?: number
  /**
   * 일시적 네트워크 에러, 타임아웃, 5xx 에러 시 최대 재시도 횟수 (기본값: 2)
   */
  maxRetries?: number
  /**
   * 지수 백오프 기본 대기 시간 (ms 단위, 기본값: 200)
   */
  retryDelayMs?: number
  storeId?: string
}
