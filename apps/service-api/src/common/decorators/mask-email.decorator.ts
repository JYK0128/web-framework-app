import { maskEmail } from '@pkg/shared/common';
import { Transform } from 'class-transformer';

/** 응답 DTO 생성 시 이메일을 마스킹하고, 유효하지 않은 값은 노출하지 않는다. */
export function MaskEmail(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !value.includes('@')) return undefined;
    return maskEmail(value);
  }, { toClassOnly: true });
}
