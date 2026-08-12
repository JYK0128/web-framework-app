import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

interface TermGroupSeedInput {
  code: string
  title: string
  isRequired: boolean
  sortOrder: number
  version: string
  content: string
}

const SEED_TERM_GROUPS: TermGroupSeedInput[] = [
  {
    code: 'service-terms',
    title: '서비스 이용약관 동의',
    isRequired: true,
    sortOrder: 1,
    version: 'v1.0.0',
    content: '본 약관은 Gatehouse 서비스 이용에 관한 제반 사항 및 제약 조건을 규정합니다.',
  },
  {
    code: 'privacy-policy',
    title: '개인정보 수집 및 이용 동의',
    isRequired: true,
    sortOrder: 2,
    version: 'v1.0.0',
    content: '개인정보 수집 항목: 이메일, 이름, 접속 로그. 수집 목적: 회원 관리 및 서비스 제공.',
  },
  {
    code: 'marketing-agree',
    title: '마케팅 정보 수신 동의',
    isRequired: false,
    sortOrder: 3,
    version: 'v1.0.0',
    content: '신규 기능 업데이트, 이벤트 정보 등 맞춤형 혜택 및 마케팅 소식을 이메일로 수신합니다.',
  },
];

export class TermsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    await this.ensureTerms(em);
    console.log('Seeded terms without auto-agreeing so accounts must go through onboarding.');
  }

  private async ensureTerms(em: EntityManager): Promise<Term[]> {
    const seededTerms: Term[] = [];

    for (const groupData of SEED_TERM_GROUPS) {
      let group = await em.findOne(TermGroup, { code: groupData.code });
      if (!group) {
        group = em.create(TermGroup, {
          code: groupData.code,
          title: groupData.title,
          isRequired: groupData.isRequired,
          sortOrder: groupData.sortOrder,
        });
        em.persist(group);
      }
      else {
        group.title = groupData.title;
        group.isRequired = groupData.isRequired;
        group.sortOrder = groupData.sortOrder;
      }

      let term = await em.findOne(Term, { termGroup: group, version: groupData.version });
      if (!term) {
        term = em.create(Term, {
          termGroup: group,
          version: groupData.version,
          content: groupData.content,
          publishedAt: new Date(),
        });
        em.persist(term);
      }
      else {
        term.content = groupData.content;
        term.publishedAt = new Date();
      }
      seededTerms.push(term);
    }

    await em.flush();
    return seededTerms;
  }
}
