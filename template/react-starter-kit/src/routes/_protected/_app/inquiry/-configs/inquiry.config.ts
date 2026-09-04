export const INQUIRY_CATEGORY_KEYS = [
  'service',
  'account',
  'payment',
  'technical',
  'etc',
] as const;

type Translate = (key: string) => string;

export function getInquiryCategoryOptions(t: Translate) {
  return INQUIRY_CATEGORY_KEYS.map((category) => {
    const label = t(`inquiry.categories.${category}`);
    return { label, value: label };
  });
}
