import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { REQUIRED_TERM_GROUP_CODES } from '#/common/constants/terms.constants';
import { Term } from '#/entities/terms/term.entity';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class TermsSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const termGroupsData = [
      {
        code: REQUIRED_TERM_GROUP_CODES[0],
        title: '서비스 이용약관 동의',
        isRequired: true,
        sortOrder: 1,
        version: 'v1.0.0',
        content: '본 약관은 AntigravityApp 서비스 이용에 관한 제반 사항 및 제약 조건을 규정합니다.',
      },
      {
        code: REQUIRED_TERM_GROUP_CODES[1],
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

    for (const groupData of termGroupsData) {
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
    }

    await em.flush();
    console.log('Seeded terms (required & optional)');
  }
}
