import { defineEnum } from '#/common/dto/enum';

export const ContentCategory = defineEnum('ContentCategory', {
  ACCOUNT: '계정',
  SERVICE: '서비스 이용',
  VERIFICATION: '검증',
} as const);

export type ContentCategory = (typeof ContentCategory)[keyof typeof ContentCategory];
