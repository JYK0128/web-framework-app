export const FAQ_CATEGORY_KEYS = [
  'account',
  'service',
  'billing',
  'security',
  'etc',
] as const;

type Translate = (key: string) => string;

export function getFaqCategoryOptions(t: Translate) {
  return FAQ_CATEGORY_KEYS.map((category) => {
    const label = t(`faqManagement.categories.${category}`);
    return { label, value: label };
  });
}

export function getFaqManagementCategoryList(t: Translate) {
  return [
    { key: 'all', label: t('faqManagement.allCategories') },
    ...FAQ_CATEGORY_KEYS.map((category) => {
      const label = t(`faqManagement.categories.${category}`);
      return { key: label, label };
    }),
  ];
}
