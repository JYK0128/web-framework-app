import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';

import { Resource } from '#/entities/auth.extentions/resource.entity';

interface ResourceSeedItem {
  key: string
  label: string
  category: string
  description: string
  icon: string
  actions: string[]
  sortOrder: number
}

const RESOURCE_SEEDS: ReadonlyArray<ResourceSeedItem> = [
  {
    key: 'notice',
    label: '공지사항',
    category: 'contents',
    description: '서비스 공지사항 게시글 등록, 조회, 수정 및 관리',
    icon: 'bell',
    actions: ['create', 'read', 'update', 'delete'],
    sortOrder: 1,
  },
  {
    key: 'faq',
    label: 'FAQ',
    category: 'contents',
    description: '자주 묻는 질문 항목 및 카테고리 관리',
    icon: 'help-circle',
    actions: ['create', 'read', 'update', 'delete'],
    sortOrder: 2,
  },
  {
    key: 'term',
    label: '이용약관',
    category: 'contents',
    description: '서비스 필수/선택 이용약관 및 개인정보 처리방침 관리',
    icon: 'file-text',
    actions: ['read', 'update'],
    sortOrder: 3,
  },
  {
    key: 'inquiry',
    label: '1:1 문의',
    category: 'support',
    description: '고객 1:1 질문 접수 및 관리자 답변/메시지 관리',
    icon: 'message-circle-question',
    actions: ['create', 'read', 'update', 'delete'],
    sortOrder: 4,
  },
  {
    key: 'user',
    label: '회원 관리',
    category: 'member',
    description: '회원 정보 조회, 역할 변경, 차단 및 보안 관리',
    icon: 'users',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    sortOrder: 5,
  },
  {
    key: 'role',
    label: '역할 및 권한',
    category: 'member',
    description: '역할 생성, 복제, 삭제 및 리소스별 접근 권한 설정',
    icon: 'shield',
    actions: ['create', 'read', 'update', 'delete', 'manage'],
    sortOrder: 6,
  },
  {
    key: 'activityLog',
    label: '감사/활동 로그',
    category: 'system',
    description: '시스템 보안 감사 및 사용자/관리자 API 활동 로그 열람',
    icon: 'activity',
    actions: ['read'],
    sortOrder: 7,
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
          category: seed.category,
          description: seed.description,
          icon: seed.icon,
          actions: seed.actions,
          sortOrder: seed.sortOrder,
        });
        em.persist(resource);
      }
      else {
        resource.label = seed.label;
        resource.category = seed.category;
        resource.description = seed.description;
        resource.icon = seed.icon;
        resource.actions = seed.actions;
        resource.sortOrder = seed.sortOrder;
      }
    }
    await em.flush();
  }
}
