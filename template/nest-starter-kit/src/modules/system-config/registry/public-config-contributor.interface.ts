import type { GetSystemConfigResponseDto } from '#/modules/system-config/dto/get-system-config.response.dto';
import type { SystemConfigValueMap } from '#/modules/system-config/dto/system-config-value-map.dto';

export const PUBLIC_CONFIG_CONTRIBUTORS = Symbol('PUBLIC_CONFIG_CONTRIBUTORS');

export type RawSystemConfigMap = Partial<SystemConfigValueMap> & Record<string, unknown>;

export interface PublicConfigContext {
  /** 현재 서버 기준 일시 (KST 처리 등에 활용) */
  readonly now: Date
  /** DB에서 조회된 원본 설정 맵 */
  readonly rawConfigs: RawSystemConfigMap
  /** 이전에 verify된 도메인별 설정값 조회 */
  getVerified<T = unknown>(key: string): T | undefined
}

/**
 * 공개 시스템 설정 등록/확장을 위한 Contributor 인터페이스
 */
export interface PublicConfigContributor<TRaw = unknown, TVerified = unknown> {
  /** 대상 SystemConfigKey 또는 확장 설정 키 */
  readonly key: string

  /**
   * [verify] 원본 설정을 도메인 DTO 등으로 파싱하고 기본값을 보정합니다.
   */
  verify(raw: TRaw): TVerified

  /**
   * [process] 최종 GetSystemConfigResponseDto 인스턴스에 필요한 공개 설정을 반영합니다.
   */
  process(
    verified: TVerified,
    context: PublicConfigContext,
    response: GetSystemConfigResponseDto,
  ): void | Promise<void>
}
