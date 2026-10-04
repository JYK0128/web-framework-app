import { HttpStatus } from '@nestjs/common';
import { ApplicationError } from '@pkg/shared/common';

type DeliveryProviderRequirement = {
  channel: string
  provider: string
  paths: string[]
};

const REQUIREMENTS: Record<string, Record<string, string[]>> = {
  sms: {
    NHN_SMS: ['nhn.appKey', 'nhn.secretKey'],
    SOLAPI_SMS: ['solapi.apiKey', 'solapi.apiSecret'],
    ALIGO_SMS: ['aligo.userId', 'aligo.apiKey'],
  },
  push: {
    FCM: ['fcm.projectId', 'fcm.clientEmail', 'fcm.privateKey'],
    NHN_PUSH: ['nhn.appKey', 'nhn.userAccessKeyId', 'nhn.secretAccessKey'],
  },
  messenger: {
    LINE: ['line.accessToken'],
    WHATSAPP: ['whatsapp.phoneNumberId', 'whatsapp.accessToken'],
    TELEGRAM: ['telegram.botToken'],
    WECHAT: ['wechat.appId', 'wechat.appSecret'],
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readPath(value: unknown, path: string): unknown {
  let current = value;
  for (const segment of path.split('.')) {
    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function getMissingPaths(value: unknown, requirement: DeliveryProviderRequirement): string[] {
  const channelConfig = isRecord(value) ? value[requirement.channel] : undefined;
  return requirement.paths.filter((path) => {
    const field = readPath(channelConfig, path);
    return typeof field !== 'string' || field.trim().length === 0;
  });
}

export function assertEnabledDeliveryProvidersAreConfigured(value: unknown): void {
  if (!isRecord(value)) return;

  const invalidChannels: { channel: string, provider: unknown, fields: string[] }[] = [];
  for (const [channel, providerRequirements] of Object.entries(REQUIREMENTS)) {
    const channelConfig = value[channel];
    if (!isRecord(channelConfig) || channelConfig.enabled !== true) continue;
    const provider = channelConfig.provider;
    if (typeof provider !== 'string') continue;
    const paths = providerRequirements[provider];
    if (!paths) continue;
    const requirement = { channel, provider, paths };
    const missingPaths = getMissingPaths(value, requirement);
    if (missingPaths.length > 0) invalidChannels.push({ channel, provider, fields: missingPaths });
  }

  if (invalidChannels.length > 0) {
    throw new ApplicationError({
      code: 'DELIVERY_PROVIDER_CONFIG_INVALID',
      status: HttpStatus.BAD_REQUEST,
      message: '활성화한 발송 채널의 선택 공급자 인증 정보를 입력해 주세요.',
      details: { channels: invalidChannels },
    });
  }
}
