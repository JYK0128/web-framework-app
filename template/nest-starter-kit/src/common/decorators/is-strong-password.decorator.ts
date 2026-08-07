import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MinLength, type ValidationOptions } from 'class-validator';

import { env } from '#/env';

export function IsStrongPassword(validationOptions?: ValidationOptions): PropertyDecorator {
  return applyDecorators(
    IsString(validationOptions),
    MinLength(env.PASSWORD_MIN_LENGTH, validationOptions),
    Matches(new RegExp(env.PASSWORD_POLICY_REGEX), {
      message: 'validation.passwordPolicyMessage',
      ...validationOptions,
    }),
  );
}
