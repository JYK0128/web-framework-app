export const ServiceSystemConfigCode = {
  OPERATION: 'operation',
  MAINTENANCE: 'maintenance',
  INQUIRY: 'inquiry',
  NOTIFICATION: 'notification',
  OAUTH: 'oauth',
} as const;

export type ServiceSystemConfigCode = (typeof ServiceSystemConfigCode)[keyof typeof ServiceSystemConfigCode];
