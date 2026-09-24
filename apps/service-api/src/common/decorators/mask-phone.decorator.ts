import { maskPhone } from '@pkg/shared/common';
import { Transform } from 'class-transformer';

/** 응답 DTO 생성 시 전화번호를 마스킹하고, 유효하지 않은 값은 노출하지 않는다. */
export function MaskPhone(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => {
    if (typeof value !== 'string' || !/^[+\d\s().-]{7,20}$/.test(value) || value.replace(/\D/g, '').length < 7) return undefined;
    return maskPhone(value);
  }, { toClassOnly: true });
}
