export const SUPPORT_CATEGORY_KEYS = [
  'service',
  'account',
  'payment',
  'technical',
  'etc',
] as const;

export function getSupportCategoryOptions(t: (key: string) => string) {
  return SUPPORT_CATEGORY_KEYS.map((category) => ({
    label: t(`support.categories.${category}`),
    value: t(`support.categories.${category}`),
  }));
}
