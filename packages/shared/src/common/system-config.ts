export const SYSTEM_CONFIGS_REDIS_KEY = 'shared:system-configs';

export const SYSTEM_CONFIG_CODES = {
  OPERATION: 'operation',
  MAINTENANCE: 'maintenance',
  SECURITY: 'security',
  INQUIRY: 'inquiry',
  NOTIFICATION: 'notification',
  OAUTH: 'oauth',
} as const;

export type SystemConfigCode = (typeof SYSTEM_CONFIG_CODES)[keyof typeof SYSTEM_CONFIG_CODES];
