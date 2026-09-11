import { encrypt, isEncrypted } from '@pkg/shared/server';
import { Transform, TransformationType } from 'class-transformer';

import { env } from '#/env';

export type SecretType = 'ENCRYPT' | 'HASH' | 'MASK';

/**
 * Property decorator for DTO fields containing sensitive secret information.
 * - Inbound (PLAIN_TO_CLASS, Request DTO): Automatically encrypts plain secret strings with AES-256-GCM.
 * - Outbound (CLASS_TO_PLAIN, Response DTO): Automatically masks secrets with empty string ("").
 */
export function Secret(type: SecretType = 'ENCRYPT'): PropertyDecorator {
  return Transform(({ value, type: transformType }) => {
    // 1. 응답 나갈 때: 빈 문자열("") 마스킹
    if (transformType === TransformationType.CLASS_TO_PLAIN) {
      return '';
    }

    // 2. 요청 들어올 때: 평문이면 자동 암호화
    if (transformType === TransformationType.PLAIN_TO_CLASS) {
      if (type === 'ENCRYPT' && typeof value === 'string' && value.trim() && !isEncrypted(value)) {
        return encrypt(value, env.APP_SECRET);
      }
    }

    return value;
  });
}
