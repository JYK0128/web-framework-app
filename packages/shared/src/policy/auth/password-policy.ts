import { ApplicationError } from '../../common/error';
import type { AuthPolicyConfig } from './policy.types';

export function assertPasswordPolicy(
  password: string,
  policy: Pick<AuthPolicyConfig,
  | 'passwordMinLength'
  | 'passwordMaxLength'
  | 'passwordMaxBytes'
  | 'passwordRequiresNumbers'
  | 'passwordRequiresUppercase'
  | 'passwordRequiresSpecialChar'>,
): void {
  let code: string | undefined;
  let byteLimitExceeded = false;
  if (password.length < policy.passwordMinLength || password.length > policy.passwordMaxLength) code = 'PASSWORD_LENGTH_INVALID';
  else if (new TextEncoder().encode(password).byteLength > policy.passwordMaxBytes) {
    code = 'PASSWORD_LENGTH_INVALID';
    byteLimitExceeded = true;
  }
  else if (policy.passwordRequiresNumbers && !/\d/u.test(password)) code = 'PASSWORD_NUMBER_REQUIRED';
  else if (policy.passwordRequiresUppercase && !/[A-Z]/u.test(password)) code = 'PASSWORD_UPPERCASE_REQUIRED';
  else if (policy.passwordRequiresSpecialChar && !/[^\p{L}\p{N}]/u.test(password)) code = 'PASSWORD_SPECIAL_CHAR_REQUIRED';

  if (!code) return;
  throw new ApplicationError({
    code,
    ...(code === 'PASSWORD_LENGTH_INVALID'
      ? {
        params: {
          minLength: policy.passwordMinLength,
          maxLength: policy.passwordMaxLength,
          maxBytes: policy.passwordMaxBytes,
          ...(byteLimitExceeded ? { byteLimitExceeded: true, context: 'byteLimitExceeded' } : {}),
        },
      }
      : {}),
    status: 400,
  });
}
