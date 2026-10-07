import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { AdminSystemConfigCode, SystemConfig } from '#/entities/system-configs/system-config.entity';

export class SystemConfigSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const configs = [
      {
        code: AdminSystemConfigCode.EMAIL,
        value: { from: '', smtp: { host: '', port: 587, secure: false, user: '', pass: '' } },
        description: '관리자 이메일 SMTP 설정',
      },
      {
        code: AdminSystemConfigCode.WEBHOOK,
        value: { enabled: false, type: 'SLACK', cooldownMinutes: 10, webhookUrl: '' },
        description: '문의 운영자 알림 웹훅 설정',
      },
      {
        code: AdminSystemConfigCode.OAUTH,
        value: {},
        description: '운영자 OAuth 로그인 공급자 설정',
      },
    ];
    for (const input of configs) {
      const existing = await em.findOne(SystemConfig, { code: input.code }, { filters: false });
      if (!existing) em.persist(em.create(SystemConfig, input));
    }
    await em.flush();
  }
}
