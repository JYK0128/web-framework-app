import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { TermGroup } from '#/entities/terms/term-group.entity';
import { Term } from '#/entities/terms/term.entity';

export class ServiceTermsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (await em.count(Term) > 0) return;
    const group = em.create(TermGroup, { code: 'service-use', title: '서비스 이용약관', isRequired: true, sortOrder: 1 });
    em.persist(em.create(Term, { termGroup: group, version: '1.0', content: '서비스 이용에 필요한 기본 약관입니다.', publishedAt: new Date() }));
    await em.flush();
  }
}
