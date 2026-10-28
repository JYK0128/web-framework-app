import { Injectable, NotFoundException } from '@nestjs/common';
import { AppEntityManager } from '@pkg/server-core/core/persistence';

import { AdminSystemConfigCode, SystemConfig } from '~/core/database/entities/system-configs';

export type SystemContextConfig = {
  adminEmail: unknown
  webhook: unknown
  oauth: unknown
};

@Injectable()
export class SystemContext {
  private cached: { value: SystemContextConfig, expiresAt: number } | null = null;

  constructor(private readonly em: AppEntityManager) {}

  invalidateCache(): void {
    this.cached = null;
  }

  async getConfig(): Promise<SystemContextConfig> {
    if (this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;

    const configs = await this.em.find(SystemConfig, {}, { filters: false });
    const valuesByCode = new Map(configs.map(({ code, value }) => [code, value]));
    const email = valuesByCode.get(AdminSystemConfigCode.EMAIL);
    const webhook = valuesByCode.get(AdminSystemConfigCode.WEBHOOK);
    const oauth = valuesByCode.get(AdminSystemConfigCode.OAUTH);
    if (email === undefined) throw new NotFoundException(`시스템 설정을 찾을 수 없습니다: ${AdminSystemConfigCode.EMAIL}`);
    if (webhook === undefined) throw new NotFoundException(`시스템 설정을 찾을 수 없습니다: ${AdminSystemConfigCode.WEBHOOK}`);
    if (oauth === undefined) throw new NotFoundException(`시스템 설정을 찾을 수 없습니다: ${AdminSystemConfigCode.OAUTH}`);
    const values: SystemContextConfig = { adminEmail: email, webhook, oauth };

    this.cached = { value: values, expiresAt: Date.now() + 5_000 };
    return values;
  }
}
