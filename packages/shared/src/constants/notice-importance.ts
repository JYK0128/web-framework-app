import { defineEnum } from '../common/enum';

export const NoticeImportance = defineEnum('NoticeImportance', {
  NORMAL: 'normal',
  IMPORTANT: 'important',
  URGENT: 'urgent',
} as const);

export type NoticeImportance = (typeof NoticeImportance)[keyof typeof NoticeImportance];
