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
  user: {
    read: definePermission('user', 'read', '관리자 조회'),
    create: definePermission('user', 'create', '관리자 생성'),
    update: definePermission('user', 'update', '관리자 수정'),
    delete: definePermission('user', 'delete', '관리자 삭제'),
    ban: definePermission('user', 'ban', '관리자 정지'),
    restore: definePermission('user', 'restore', '관리자 복구'),
    reset2fa: definePermission('user', 'reset_2fa', '2FA 초기화'),
    changeRole: definePermission('user', 'change_role', '관리자 역할 변경'),
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
  },
} as const;

export const ALL_PERMISSIONS: readonly PermissionDefinition[] = [
  ...Object.values(Permission.user),
  ...Object.values(Permission.role),
  ...Object.values(Permission.terms),
  ...Object.values(Permission.system),
  ...Object.values(Permission.log),
  ...Object.values(Permission.customer),
];

export type PermissionCode = (typeof ALL_PERMISSIONS)[number]['code'];
