import { z } from '@pkg/shared/common';

export const publishScheduleSchema = z.string().refine(
  (value) => !value || (Number.isFinite(Date.parse(value)) && Date.parse(value) > Date.now()),
  '현재 이후의 게시 예정일을 선택해 주세요.',
);

export function toPublishedAt(value: string | undefined): string | null {
  return value || null;
}
