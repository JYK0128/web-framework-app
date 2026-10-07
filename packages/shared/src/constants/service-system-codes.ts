export const ServiceSystemConfigCode = {
  OPERATION: 'operation',
  MAINTENANCE: 'maintenance',
  INQUIRY: 'inquiry',
  WEBHOOK: 'webhook',
  DELIVERY: 'delivery',
  OAUTH: 'oauth',
} as const;

export type ServiceSystemConfigCode = (typeof ServiceSystemConfigCode)[keyof typeof ServiceSystemConfigCode];
