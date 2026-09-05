import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Resource } from '#/entities/auth.extentions/resource.entity';

interface ResourceSeedItem {
  key: string
  label: string
  description: string
  actions: string[]
}

const RESOURCE_SEEDS: ReadonlyArray<ResourceSeedItem> = [
  {
    key: 'notice',
    label: '공지사항',
    description: '서비스 공지사항 게시글 등록, 조회, 수정 및 관리',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    key: 'faq',
    label: 'FAQ',
    description: '자주 묻는 질문 항목 및 카테고리 관리',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    key: 'term',
    label: '이용약관',
    description: '서비스 필수/선택 이용약관 및 개인정보 처리방침 관리',
    actions: ['read', 'update'],
  },
  {
    key: 'inquiry',
    label: '1:1 문의',
    description: '고객 1:1 질문 접수 및 관리자 답변/메시지 관리',
    actions: ['create', 'read', 'update', 'delete'],
  },
  {
    key: 'user',
    label: '회원 관리',
    description: '회원 정보 조회, 역할 변경, 차단 및 보안 관리',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  {
    key: 'role',
    label: '역할 및 권한',
    description: '역할 생성, 복제, 삭제 및 리소스별 접근 권한 설정',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
  },
  {
    key: 'log',
    label: '로그 관리',
    description: '시스템 보안 감사 및 사용자/관리자 API 로그 열람',
    actions: ['read', 'manage'],
  },
];

export class ResourceSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    for (const seed of RESOURCE_SEEDS) {
      let resource = await em.findOne(Resource, { key: seed.key });
      if (!resource) {
        resource = em.create(Resource, {
          key: seed.key,
          label: seed.label,
          description: seed.description,
          actions: seed.actions,
        });
        em.persist(resource);
      }
      else {
        resource.label = seed.label;
        resource.description = seed.description;
        resource.actions = seed.actions;
      }
    }
    await em.flush();
  }
}
