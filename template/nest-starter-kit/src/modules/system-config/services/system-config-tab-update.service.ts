import { HttpStatus, Injectable } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

import { SystemConfig as SystemConfigEntity, type SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';

@Injectable()
export class SystemConfigTabUpdateService {
  constructor(
    private readonly em: AppEntityManager,
  ) {}

  async update(
    keys: readonly SystemConfigKey[],
    apply: (configs: Map<string, SystemConfigEntity>) => void,
    adminUserId: string,
  ): Promise<SystemConfigEntity[]> {
    const configs = await Promise.all(keys.map((key) => this.identify(key)));
    const configMap = new Map(configs.map((config) => [config.key, config]));

    apply(configMap);
    for (const config of configs) config.updatedBy = adminUserId;

    await this.em.flush();
    return configs;
  }

  private async identify(key: SystemConfigKey): Promise<SystemConfigEntity> {
    const entity = await this.em.findOne(SystemConfigEntity, { key }, { filters: false });
    if (!entity) {
      throw new ApplicationError({
        code: 'SYSTEM_CONFIG_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: `시스템 설정을 찾을 수 없습니다: ${key}`,
      });
    }
    return entity;
  }
}
