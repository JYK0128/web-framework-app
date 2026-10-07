export function receptionOptionLabel(key: string): string {
  return ({ email: '이메일', sms: '문자', messenger: '메신저' } as Record<string, string>)[key] ?? key;
}
