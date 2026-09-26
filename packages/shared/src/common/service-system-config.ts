export const SERVICE_SYSTEM_CONFIG_CODES = {
  OPERATION: 'operation',
  MAINTENANCE: 'maintenance',
  SECURITY: 'security',
  INQUIRY: 'inquiry',
  WEBHOOK: 'webhook',
  DELIVERY: 'delivery',
  OAUTH: 'oauth',
} as const;

export type ServiceSystemConfigCode = (typeof SERVICE_SYSTEM_CONFIG_CODES)[keyof typeof SERVICE_SYSTEM_CONFIG_CODES];
