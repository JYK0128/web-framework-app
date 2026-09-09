import { defineEnum } from '#/common/dto/enum';

export const MessageChannel = defineEnum('MessageChannel', {
  EMAIL: 'EMAIL',
  SLACK: 'SLACK',
  IN_APP: 'IN_APP',
  SMS: 'SMS',
  ALIMTALK: 'ALIMTALK',
} as const);

export type MessageChannel = (typeof MessageChannel)[keyof typeof MessageChannel];
