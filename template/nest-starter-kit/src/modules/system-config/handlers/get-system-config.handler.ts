import { Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { SystemConfig as SystemConfigEntity, SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { GetSystemConfigResponseDto } from '#/modules/system-config/dto';
import { GetSystemConfigQuery } from '#/modules/system-config/queries/get-system-config.query';
import { type PublicConfigContext, PublicConfigRegistry, type RawSystemConfigMap } from '#/modules/system-config/registry';

@Injectable()
@QueryHandler(GetSystemConfigQuery)
export class GetSystemConfigHandler implements IQueryHandler<GetSystemConfigQuery, GetSystemConfigResponseDto> {
  constructor(
    private readonly em: AppEntityManager,
    private readonly registry: PublicConfigRegistry,
  ) {}

  async execute(): Promise<GetSystemConfigResponseDto> {
    // 1. identify: DB에서 시스템 설정 전체 로드
    const { rawConfigs, publicEntities } = await this.identifyConfigs();

    // 2. verify: 등록된 컨트리뷰터를 통해 설정 파싱 및 기본값 보정
    const verifiedMap = this.verifyConfigs(rawConfigs);

    // 3. process: KST 기준 실시간 운영 상태 판정 및 등록된 공개 설정 조율
    return this.processResponse(rawConfigs, verifiedMap, publicEntities);
  }

  /**
   * [1. identify] DB에서 시스템 설정 전체 로드
   */
  private async identifyConfigs(): Promise<{
    rawConfigs: RawSystemConfigMap
    publicEntities: Map<string, Record<string, unknown>>
  }> {
    const entities = await this.em.find(SystemConfigEntity, {}, { filters: false });
    const rawConfigs: RawSystemConfigMap = {};
    const publicEntities = new Map<string, Record<string, unknown>>();

    for (const ent of entities) {
      rawConfigs[ent.key] = ent.value as never;
      if (ent.isPublic) {
        publicEntities.set(ent.key, ent.value ?? {});
      }
    }

    return { rawConfigs, publicEntities };
  }

  /**
   * [2. verify] 등록된 각 Contributor를 통해 원본 설정 검증 및 타입 DTO 변환
   */
  private verifyConfigs(raw: RawSystemConfigMap): Map<string, unknown> {
    const verifiedMap = new Map<string, unknown>();
    const contributors = this.registry.getAll();

    for (const contributor of contributors) {
      const rawValue = raw[contributor.key];
      const verified = contributor.verify(rawValue);
      verifiedMap.set(contributor.key, verified);
    }

    return verifiedMap;
  }

  /**
   * [3. process] 등록된 각 Contributor를 실행하여 최종 GetSystemConfigResponseDto 구성
   */
  private async processResponse(
    rawConfigs: RawSystemConfigMap,
    verifiedMap: Map<string, unknown>,
    publicEntities: Map<string, Record<string, unknown>>,
  ): Promise<GetSystemConfigResponseDto> {
    const response = new GetSystemConfigResponseDto();
    const context: PublicConfigContext = {
      now: new Date(),
      rawConfigs,
      getVerified: <T = unknown>(key: string) => verifiedMap.get(key) as T | undefined,
    };

    // 점검 설정(MAINTENANCE)이 먼저 처리되어야 운영 상태(OPERATION)에서 점검 모드 여부를 참조 가능
    const contributors = this.registry.getAll().sort((a, b) => {
      if (a.key === SystemConfigKey.MAINTENANCE) return -1;
      if (b.key === SystemConfigKey.MAINTENANCE) return 1;
      if (a.key === SystemConfigKey.OPERATION) return -1;
      if (b.key === SystemConfigKey.OPERATION) return 1;
      return 0;
    });

    const handledKeys = new Set<string>();

    for (const contributor of contributors) {
      handledKeys.add(contributor.key);
      const verified = verifiedMap.get(contributor.key);
      await contributor.process(verified, context, response);
    }

    // 별도 Contributor가 등록되지 않은 DB의 isPublic: true 설정들은 configs 맵에 자동 노출
    const publicConfigs = Object.fromEntries(
      [...publicEntities].filter(([key]) => !handledKeys.has(key)),
    );
    if (Object.keys(publicConfigs).length > 0) {
      response.configs = { ...response.configs, ...publicConfigs };
    }

    return response;
  }
}
