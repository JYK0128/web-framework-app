import { defineEnum } from '../common/enum';

export const QnaStatus = defineEnum('QnaStatus', {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  ANSWERED: 'answered',
  CLOSED: 'closed',
} as const);

export type QnaStatus = (typeof QnaStatus)[keyof typeof QnaStatus];

export const QnaPriority = defineEnum('QnaPriority', {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
} as const);

export type QnaPriority = (typeof QnaPriority)[keyof typeof QnaPriority];
