import { applyDecorators } from '@nestjs/common';
import { IsString, Matches, MaxLength, MinLength, type ValidationOptions } from 'class-validator';

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_REGEX } from '#/common/constants/auth.constants';

export function IsStrongPassword(validationOptions?: ValidationOptions): PropertyDecorator {
  return applyDecorators(
    IsString(validationOptions),
    MinLength(PASSWORD_MIN_LENGTH, validationOptions),
    MaxLength(PASSWORD_MAX_LENGTH, validationOptions),
    Matches(new RegExp(PASSWORD_POLICY_REGEX), {
      message: 'validation.passwordCompositionMessage',
      ...validationOptions,
    }),
  );
}
