import { parsePhoneNumberFromString } from 'libphonenumber-js';

export function normalizePhoneNumber(phoneNumber: string): string {
  const parsed = parsePhoneNumberFromString(phoneNumber, 'KR');
  if (!parsed?.isValid()) return phoneNumber.replace(/[\s-]/g, '');
  if (parsed.country === 'KR') return parsed.formatNational().replace(/[^\d]/g, '');
  return parsed.number;
}
