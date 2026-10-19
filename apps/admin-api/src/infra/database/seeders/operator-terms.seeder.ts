import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

const ADMIN_TERMS = [
  {
    title: '정보보호 서약서',
    sortOrder: 10,
    content: '운영자 권한으로 취급하는 정보와 시스템을 안전하게 보호하고, 업무 목적 외에는 사용하지 않겠습니다.',
  },
  {
    title: '개인정보 취급 서약서',
    sortOrder: 20,
    content: '업무 중 취급하는 개인정보를 관련 법령과 내부 정책에 따라 안전하게 관리하겠습니다.',
  },
  {
    title: '관리 시스템 이용약관',
    sortOrder: 30,
    content: '관리 시스템을 승인된 업무 목적과 권한 범위 안에서 이용하며, 계정 정보를 타인과 공유하지 않겠습니다.',
  },
] as const;

export class OperatorTermsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (await em.count(TermGroup, {}, { filters: false }) > 0) return;
    for (const input of ADMIN_TERMS) {
      const group = em.create(TermGroup, {
        title: input.title,
        isRequired: true,
        sortOrder: input.sortOrder,
      });
      em.persist(group);
      const term = em.create(Term, {
        termGroup: group,
        version: '1.0',
        content: input.content,
        reason: '초기 약관 등록',
        summary: input.title,
        isNoticeRequired: false,
        publishedAt: new Date(),
      });
      em.persist(term);
    }

    await em.flush();
  }
}
