export const CATEGORY_LABELS: Record<string, { label: string, description: string }> = {
  contents: { label: '콘텐츠 관리 (CMS)', description: '공지사항, FAQ, 약관 등 서비스 게시글 및 문서' },
  support: { label: '고객지원 (CS)', description: '고객 문의 및 지원 업무' },
  member: { label: '회원 및 보안', description: '사용자 및 역할/권한 관리' },
  system: { label: '시스템 운영', description: '감사 로그 및 인프라/설정 관리' },
  general: { label: '일반 기능', description: '기타 시스템 기능' },
};

export function toggleCrudAction(
  permissions: Record<string, string[]>,
  resourceKey: string,
  action: string,
) {
  const current = permissions[resourceKey] || [];
  const next = current.includes(action)
    ? current.filter((item) => item !== action)
    : [...current, action];
  return { ...permissions, [resourceKey]: next };
}

export function toggleAllCrudActions(
  permissions: Record<string, string[]>,
  resourceKey: string,
  availableActions: string[],
) {
  const current = permissions[resourceKey] || [];
  const isAllSelected = availableActions.every((action) => current.includes(action));
  return { ...permissions, [resourceKey]: isAllSelected ? [] : [...availableActions] };
}
