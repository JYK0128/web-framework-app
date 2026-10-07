import type { AuthPolicyConfig } from '@pkg/shared/auth';

export function describePasswordPolicy(policy?: AuthPolicyConfig): string {
  if (!policy) return '비밀번호 정책을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.';
  const requirements = [
    policy.passwordRequiresNumbers && '숫자',
    policy.passwordRequiresSpecialChar && '특수문자',
    policy.passwordRequiresUppercase && '영문 대문자',
  ].filter(Boolean);
  const requirementText = requirements.length
    ? `이며 ${requirements.join(', ')}를 포함해야 합니다`
    : '로 입력해 주세요';
  return `비밀번호는 ${policy.passwordMinLength}~${policy.passwordMaxLength}자, UTF-8 기준 ${policy.passwordMaxBytes}바이트 이하${requirementText}.`;
}

export function getPasswordPolicyError(password: string, policy?: AuthPolicyConfig): string | undefined {
  if (!policy) return '비밀번호 정책을 확인한 뒤 다시 시도해 주세요.';
  if (
    password.length < policy.passwordMinLength
    || password.length > policy.passwordMaxLength
    || new TextEncoder().encode(password).byteLength > policy.passwordMaxBytes
  ) {
    return `비밀번호는 ${policy.passwordMinLength}~${policy.passwordMaxLength}자이며 UTF-8 기준 ${policy.passwordMaxBytes}바이트 이하여야 합니다.`;
  }
  if (policy.passwordRequiresNumbers && !/\d/u.test(password)) return '비밀번호에 숫자를 포함해야 합니다.';
  if (policy.passwordRequiresUppercase && !/[A-Z]/u.test(password)) return '비밀번호에 영문 대문자를 포함해야 합니다.';
  if (policy.passwordRequiresSpecialChar && !/[^\p{L}\p{N}]/u.test(password)) return '비밀번호에 특수문자를 포함해야 합니다.';
  return undefined;
}
