import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Faq } from '#/entities/faqs/faq.entity';

const FAQ_SEEDS = [
  { category: '계정', question: '비밀번호를 잊어버렸어요.', answer: '로그인 화면의 비밀번호 찾기에서 계정 이메일을 입력해 주세요.', sortOrder: 1, isPublished: true },
  { category: '서비스 이용', question: '서비스 이용 시간은 어떻게 되나요?', answer: '서비스는 원칙적으로 24시간 이용할 수 있습니다.', sortOrder: 2, isPublished: true },
  { category: '서비스 이용', question: '공개되지 않은 FAQ도 볼 수 있나요?', answer: '관리자가 게시한 FAQ만 공개 목록과 상세 화면에 표시됩니다.', sortOrder: 3, isPublished: false },
];

export class FaqSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    if (await em.count(Faq) > 0) return;
    em.persist(FAQ_SEEDS.map((seed) => em.create(Faq, seed)));
    await em.flush();
  }
}
