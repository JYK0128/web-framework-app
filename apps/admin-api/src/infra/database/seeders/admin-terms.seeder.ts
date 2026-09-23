import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

const ADMIN_TERMS = [
  {
    code: 'admin-security-pledge',
    title: '정보보호 서약서',
    sortOrder: 10,
    content: '관리자 권한으로 취급하는 정보와 시스템을 안전하게 보호하고, 업무 목적 외에는 사용하지 않겠습니다.',
  },
  {
    code: 'admin-privacy-pledge',
    title: '개인정보 취급 서약서',
    sortOrder: 20,
    content: '업무 중 취급하는 개인정보를 관련 법령과 내부 정책에 따라 안전하게 관리하겠습니다.',
  },
  {
    code: 'admin-system-use',
    title: '관리 시스템 이용약관',
    sortOrder: 30,
    content: '관리 시스템을 승인된 업무 목적과 권한 범위 안에서 이용하며, 계정 정보를 타인과 공유하지 않겠습니다.',
  },
] as const;

export class AdminTermsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const input of ADMIN_TERMS) {
      let group = await em.findOne(TermGroup, { code: input.code }, { filters: false });
      if (!group) {
        group = em.create(TermGroup, {
          code: input.code,
          title: input.title,
          isRequired: true,
          sortOrder: input.sortOrder,
        });
        em.persist(group);
      }

      const existingTerm = await em.findOne(Term, {
        termGroup: group,
        version: '1.0',
      }, { filters: false });
      if (!existingTerm) {
        const term = em.create(Term, {
          termGroup: group,
          version: '1.0',
          content: input.content,
          publishedAt: new Date(),
        });
        em.persist(term);
      }
    }

    await em.flush();
  }
}
