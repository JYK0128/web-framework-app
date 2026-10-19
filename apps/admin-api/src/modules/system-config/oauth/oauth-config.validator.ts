import { validateSync, ValidatorConstraint, type ValidatorConstraintInterface } from 'class-validator';

import { OAuthProviderDetailDto } from '#/modules/system-config/oauth/oauth-provider-detail.dto';

@ValidatorConstraint({ name: 'oauthConfig', async: false })
export class OAuthConfigValidator implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    return Object.values(value).every((provider: unknown) => {
      if (typeof provider !== 'object' || provider === null || Array.isArray(provider)) return false;
      return validateSync(OAuthProviderDetailDto.parse(provider), {
        whitelist: true,
        forbidNonWhitelisted: true,
        validationError: { target: false, value: false },
      }).length === 0;
    });
  }

  defaultMessage(): string {
    return 'OAuth 프로바이더 설정이 올바르지 않습니다.';
  }
}
