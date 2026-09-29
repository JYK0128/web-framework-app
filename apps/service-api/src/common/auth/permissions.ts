export interface ServicePermissionDefinition {
  readonly code: string
  readonly resource: string
  readonly action: string
  readonly label: string
  readonly description?: string
}

const definePermission = (resource: string, action: string, label: string, description?: string): ServicePermissionDefinition => ({
  code: `${resource}:${action}`,
  resource,
  action,
  label,
  description,
});

/** Customer-facing capabilities owned by service-api. This is intentionally separate from admin-api RBAC permissions. */
export const ServicePermission = {
  feature: {
    access: definePermission('feature', 'access', '서비스 이용', '서비스 기본 기능 이용'),
    premium: definePermission('feature', 'premium', '프리미엄 기능', '프리미엄 기능 이용'),
  },
  benefit: {
    prioritySupport: definePermission('benefit', 'priority_support', '우선 지원', '우선 고객 지원 이용'),
  },
} as const;

export const ALL_SERVICE_PERMISSIONS: readonly ServicePermissionDefinition[] = [
  ...Object.values(ServicePermission.feature),
  ...Object.values(ServicePermission.benefit),
];

export type ServicePermissionCode = (typeof ALL_SERVICE_PERMISSIONS)[number]['code'];
