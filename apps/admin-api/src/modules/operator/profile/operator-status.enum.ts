import { defineEnum } from '@pkg/shared/common';

export const OperatorStatus = defineEnum('OperatorStatus', {
  ACTIVE: 'active',
  BANNED: 'banned',
  DELETED: 'deleted',
} as const);

export type OperatorStatus = (typeof OperatorStatus)[keyof typeof OperatorStatus];
