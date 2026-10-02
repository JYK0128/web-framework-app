import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { AdminSystemConfigCode, SystemConfig } from '#/entities/system-configs/system-config.entity';

export class SystemConfigSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.findOne(SystemConfig, { code: AdminSystemConfigCode.OAUTH }, { filters: false });
    if (existing) return;
    em.persist(em.create(SystemConfig, {
      code: AdminSystemConfigCode.OAUTH,
      value: {},
      description: '운영자 OAuth 로그인 공급자 설정',
    }));
    await em.flush();
  }
}
