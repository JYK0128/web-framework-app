export const REQUIRED_TERM_GROUP_CODES = [
  'service-terms',
  'privacy-policy',
] as const;

export type RequiredTermGroupCode = (typeof REQUIRED_TERM_GROUP_CODES)[number];
