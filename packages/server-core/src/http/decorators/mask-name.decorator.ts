import { maskName } from '@pkg/shared/common';
import { Transform } from 'class-transformer';

/** 응답 DTO 생성 시 이름을 마스킹하고, 유효하지 않은 값은 노출하지 않는다. */
export function MaskName(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !value.trim()) return undefined;
    return maskName(value);
  }, { toClassOnly: true });
}
