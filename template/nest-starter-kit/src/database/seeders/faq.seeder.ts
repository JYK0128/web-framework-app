import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Faq } from '#/entities/faqs/faq.entity';

const FAQ_SEEDS = [
  {
    category: '계정/인증',
    question: '비밀번호를 분실했습니다. 어떻게 재설정하나요?',
    answer: '로그인 화면에서 [비밀번호 찾기] 링크를 클릭한 후, 가입 시 등록한 이메일 주소를 입력하시면 비밀번호 재설정 인증 메일이 발송됩니다.',
    order: 1,
    isPublished: true,
    helpfulCount: 12,
  },
  {
    category: '계정/인증',
    question: '이메일 주소나 회원 정보를 변경하고 싶습니다.',
    answer: '우측 상단의 프로필 메뉴에서 [프로필 설정]으로 이동하신 후 기본 정보 및 연락처를 변경하실 수 있습니다. 이메일 주소 변경 시에는 추가 인증이 필요할 수 있습니다.',
    order: 2,
    isPublished: true,
    helpfulCount: 8,
  },
  {
    category: '서비스 이용',
    question: '공지사항 알림은 어디서 확인하나요?',
    answer: '화면 상단 헤더 우측의 알림 벨 아이콘을 클릭하시면 새로운 공지사항 및 시스템 알림을 실시간으로 확인하실 수 있습니다.',
    order: 3,
    isPublished: true,
    helpfulCount: 15,
  },
  {
    category: '서비스 이용',
    question: '다크 모드는 어떻게 설정하나요?',
    answer: '헤더 우측 상단의 해/달 모양 테마 토글 버튼을 클릭하시면 라이트 모드, 다크 모드, 시스템 기본 설정을 자유롭게 전환하실 수 있습니다.',
    order: 4,
    isPublished: true,
    helpfulCount: 20,
  },
  {
    category: '보안/권한',
    question: '2단계 인증(2FA)은 어떻게 활성화하나요?',
    answer: '[프로필] > [보안 설정] 탭에서 Google Authenticator 또는 호환 OTP 앱을 연동하여 2단계 인증을 안전하게 설정하실 수 있습니다.',
    order: 5,
    isPublished: true,
    helpfulCount: 5,
  },
  {
    category: '기타',
    question: '서비스 이용 중 오류가 발생했습니다. 어디로 문의하나요?',
    answer: '하단의 1:1 고객센터 문의 또는 support@example.com으로 오류 화면 캡처와 함께 메일을 주시면 영업일 기준 24시간 이내에 안내해 드립니다.',
    order: 6,
    isPublished: true,
    helpfulCount: 9,
  },
];

export class FaqSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existingCount = await em.count(Faq);
    if (existingCount > 0) return;

    for (const seed of FAQ_SEEDS) {
      const faq = em.create(Faq, seed);
      em.persist(faq);
    }
    await em.flush();
  }
}
