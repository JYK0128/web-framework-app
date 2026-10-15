import type { TFunction } from '@pkg/shared/common';
import type { AuthPolicyConfig } from '@pkg/shared/policy';

export function describePasswordPolicy(policy: AuthPolicyConfig | undefined, t: TFunction): string {
  if (!policy) return t('passwordPolicy.unavailable');
  const requirements = [
    policy.passwordRequiresNumbers && t('passwordPolicy.number'),
    policy.passwordRequiresSpecialChar && t('passwordPolicy.specialCharacter'),
    policy.passwordRequiresUppercase && t('passwordPolicy.uppercase'),
  ].filter((requirement): requirement is string => typeof requirement === 'string');
  const description = t('passwordPolicy.description', {
    minLength: policy.passwordMinLength,
    maxLength: policy.passwordMaxLength,
  });
  if (!requirements.length) return description;

  return `${description} ${t('passwordPolicy.requirements', { requirements: requirements.join(', ') })}`;
}

export function getPasswordPolicyError(password: string, policy: AuthPolicyConfig | undefined, t: TFunction): string | undefined {
  if (!policy) return t('passwordPolicy.unavailable');
  if (
    password.length < policy.passwordMinLength
    || password.length > policy.passwordMaxLength
  ) {
    return t('passwordPolicy.lengthError', {
      minLength: policy.passwordMinLength,
      maxLength: policy.passwordMaxLength,
    });
  }
  if (new TextEncoder().encode(password).byteLength > policy.passwordMaxBytes) return t('passwordPolicy.tooLong');
  if (policy.passwordRequiresNumbers && !/\d/u.test(password)) return t('passwordPolicy.numberRequired');
  if (policy.passwordRequiresUppercase && !/[A-Z]/u.test(password)) return t('passwordPolicy.uppercaseRequired');
  if (policy.passwordRequiresSpecialChar && !/[^\p{L}\p{N}]/u.test(password)) return t('passwordPolicy.specialCharacterRequired');
  return undefined;
}
