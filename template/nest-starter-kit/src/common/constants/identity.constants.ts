import { defineEnum } from '#/common/dto/enum';

export const Gender = defineEnum('Gender', {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
} as const);

export type Gender = (typeof Gender)[keyof typeof Gender];
