import { env } from '~/env';

const ENCRYPTION_KEYS: Record<string, string> = {
  email: env.NOTIFICATION_EMAIL_ENCRYPTION_KEY,
  messenger: env.NOTIFICATION_MESSENGER_ENCRYPTION_KEY,
  sms: env.NOTIFICATION_SMS_ENCRYPTION_KEY,
  push: env.NOTIFICATION_PUSH_ENCRYPTION_KEY,
};

export const NOTIFICATION_SECRET_PATHS = [
  'email.smtp.pass',
  'messenger.kakao.nhn.appKey',
  'messenger.kakao.nhn.secretKey',
  'messenger.kakao.solapi.apiKey',
  'messenger.kakao.solapi.apiSecret',
  'messenger.kakao.aligo.apiKey',
  'messenger.line.channelSecret',
  'messenger.line.accessToken',
  'messenger.whatsapp.accessToken',
  'messenger.telegram.botToken',
  'messenger.wechat.appSecret',
  'sms.nhn.secretKey',
  'sms.solapi.apiKey',
  'sms.solapi.apiSecret',
  'sms.aligo.apiKey',
  'push.fcm.apiKey',
  'push.fcm.privateKey',
  'push.nhn.appKey',
  'push.nhn.userAccessKeyId',
  'push.nhn.secretAccessKey',
] as const;

export function transformNotificationSecrets(value: Record<string, unknown>, transform: (secret: string, key: string) => string): void {
  for (const secretPath of NOTIFICATION_SECRET_PATHS) {
    const path = secretPath.split('.');
    let current: unknown = value;
    for (const key of path.slice(0, -1)) {
      if (!isRecord(current)) break;
      current = current[key];
    }
    if (!isRecord(current)) continue;
    const secretKey = path[path.length - 1];
    const secret = current[secretKey];
    const encryptionKey = ENCRYPTION_KEYS[path[0]];
    if (typeof secret === 'string' && secret.length > 0 && encryptionKey) current[secretKey] = transform(secret, encryptionKey);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
