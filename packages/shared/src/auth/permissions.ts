export interface PermissionDefinition {
  readonly code: string
  readonly resource: string
  readonly action: string
  readonly label: string
  readonly description?: string
}

function definePermission(
  resource: string,
  action: string,
  label: string,
  description?: string,
): PermissionDefinition {
  return {
    code: `${resource}:${action}`,
    resource,
    action,
    label,
    description,
  };
}

export const Permission = {
  operator: {
    read: definePermission('operator', 'read', '운영자 조회'),
    create: definePermission('operator', 'create', '운영자 생성'),
    update: definePermission('operator', 'update', '운영자 수정'),
    delete: definePermission('operator', 'delete', '운영자 삭제'),
    ban: definePermission('operator', 'ban', '운영자 정지'),
    restore: definePermission('operator', 'restore', '운영자 복구'),
    reset2fa: definePermission('operator', 'reset_2fa', '운영자 2FA 초기화'),
    changeRole: definePermission('operator', 'change_role', '운영자 역할 변경'),
  },
  role: {
    read: definePermission('role', 'read', '역할 조회'),
    create: definePermission('role', 'create', '역할 생성'),
    update: definePermission('role', 'update', '역할 수정'),
    delete: definePermission('role', 'delete', '역할 삭제'),
  },
  terms: {
    read: definePermission('terms', 'read', '약관 조회'),
    create: definePermission('terms', 'create', '약관 생성'),
    update: definePermission('terms', 'update', '약관 수정'),
    delete: definePermission('terms', 'delete', '약관 삭제'),
    publish: definePermission('terms', 'publish', '약관 게시'),
    agree: definePermission('terms', 'agree', '약관 동의'),
  },
  system: {
    read: definePermission('system', 'read', '시스템 설정 조회'),
    update: definePermission('system', 'update', '시스템 설정 수정'),
  },
  log: {
    read: definePermission('log', 'read', '로그 조회'),
  },
  customer: {
    read: definePermission('customer', 'read', '고객 조회'),
    piiRead: definePermission('customer', 'read_pii', '고객 개인정보 원문 조회'),
    update: definePermission('customer', 'update', '고객 수정'),
    delete: definePermission('customer', 'delete', '고객 삭제'),
  },
  faq: {
    read: definePermission('faq', 'read', 'FAQ 조회'),
    create: definePermission('faq', 'create', 'FAQ 생성'),
    update: definePermission('faq', 'update', 'FAQ 수정'),
    delete: definePermission('faq', 'delete', 'FAQ 삭제'),
  },
  qna: {
    read: definePermission('qna', 'read', 'Q&A 조회'),
    create: definePermission('qna', 'create', 'Q&A 생성'),
    update: definePermission('qna', 'update', 'Q&A 수정'),
    delete: definePermission('qna', 'delete', 'Q&A 삭제'),
  },
  support: {
    read: definePermission('support', 'read', '고객지원 조회'),
    update: definePermission('support', 'update', '고객지원 답변'),
  },
  serviceTerm: {
    read: definePermission('service_term', 'read', '서비스 약관 조회'),
    create: definePermission('service_term', 'create', '서비스 약관 생성'),
    update: definePermission('service_term', 'update', '서비스 약관 수정'),
    delete: definePermission('service_term', 'delete', '서비스 약관 삭제'),
    publish: definePermission('service_term', 'publish', '서비스 약관 게시'),
  },
} as const;

export const ALL_PERMISSIONS: readonly PermissionDefinition[] = [
  ...Object.values(Permission.operator),
  ...Object.values(Permission.role),
  ...Object.values(Permission.terms),
  ...Object.values(Permission.system),
  ...Object.values(Permission.log),
  ...Object.values(Permission.customer),
  ...Object.values(Permission.faq),
  ...Object.values(Permission.qna),
  ...Object.values(Permission.support),
  ...Object.values(Permission.serviceTerm),
];

export type PermissionCode = (typeof ALL_PERMISSIONS)[number]['code'];
