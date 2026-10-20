import type { PermissionDefinition } from './permissions';

export type ServicePermissionDefinition = PermissionDefinition;

function definePermission(
  resource: string,
  action: string,
  label: string,
  description?: string,
): ServicePermissionDefinition {
  return { code: `${resource}:${action}`, resource, action, label, description };
}

/** Customer-facing API permissions, grouped by resource and action. */
export const ServicePermission = {
  account: {
    update: definePermission('account', 'update', '계정 수정'),
    delete: definePermission('account', 'delete', '계정 탈퇴'),
  },
  customer: {
    read: definePermission('customer', 'read', '고객 정보 조회'),
  },
  notification: {
    read: definePermission('notification', 'read', '알림 조회'),
  },
  qna: {
    read: definePermission('qna', 'read', 'Q&A 조회'),
    create: definePermission('qna', 'create', 'Q&A 생성'),
    update: definePermission('qna', 'update', 'Q&A 수정'),
    delete: definePermission('qna', 'delete', 'Q&A 삭제'),
  },
  serviceTerm: {
    read: definePermission('service_term', 'read', '서비스 약관 동의 조회'),
    agree: definePermission('service_term', 'agree', '서비스 약관 동의'),
  },
  support: {
    read: definePermission('support', 'read', '고객지원 조회'),
    create: definePermission('support', 'create', '고객지원 문의 생성'),
    update: definePermission('support', 'update', '고객지원 문의 수정'),
  },
} as const;

export const ALL_SERVICE_PERMISSIONS = [
  ...Object.values(ServicePermission.account),
  ...Object.values(ServicePermission.customer),
  ...Object.values(ServicePermission.notification),
  ...Object.values(ServicePermission.qna),
  ...Object.values(ServicePermission.serviceTerm),
  ...Object.values(ServicePermission.support),
] as const satisfies readonly ServicePermissionDefinition[];

export type ServicePermissionCode = (typeof ALL_SERVICE_PERMISSIONS)[number]['code'];

export const MEMBER_PERMISSION_CODES = ALL_SERVICE_PERMISSIONS
  .filter(({ resource }) => resource !== 'support')
  .map(({ code }) => code);
