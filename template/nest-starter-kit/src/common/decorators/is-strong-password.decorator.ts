import { applyDecorators } from '@nestjs/common';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, PASSWORD_POLICY_REGEX } from '@pkg/shared/common';
import { IsString, Matches, MaxLength, MinLength, type ValidationOptions } from 'class-validator';

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
