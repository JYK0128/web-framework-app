import { defineEnum } from '#/common/schema/enum';

export const UserStatus = defineEnum('UserStatus', {
  ACTIVE: 'active',
  BANNED: 'banned',
  DELETED: 'deleted',
} as const);

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];
