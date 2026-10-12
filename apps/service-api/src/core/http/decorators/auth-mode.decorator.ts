import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const AUTH_MODE_KEY = 'authMode';
export const SKIP_TWO_FACTOR_SETUP_KEY = 'skipTwoFactorSetup';
export const SKIP_PHONE_VERIFICATION_KEY = 'skipPhoneVerification';
// Internal reflection metadata key; it never contains a credential.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
export const SKIP_PASSWORD_EXPIRY_KEY = 'skipPasswordExpiry';
const SWAGGER_API_OPERATION_KEY = 'swagger/apiOperation';

export type AuthMode = 'public' | 'user' | 'machine';

export const AuthMode = (mode: AuthMode) => SetMetadata(AUTH_MODE_KEY, mode);

const PublicSwagger = (): MethodDecorator => (_target, _propertyKey, descriptor) => {
  if (!descriptor?.value) return descriptor;

  const operationMetadata = Reflect.getMetadata(SWAGGER_API_OPERATION_KEY, descriptor.value) as Record<string, unknown> | undefined ?? {};
  Reflect.defineMetadata(
    SWAGGER_API_OPERATION_KEY,
    { ...operationMetadata, security: [] },
    descriptor.value,
  );

  return descriptor;
};

export const Public = () => applyDecorators(AuthMode('public'), PublicSwagger());

export const UserAuth = () => applyDecorators(AuthMode('user'), ApiBearerAuth());

export const MachineAuth = () => applyDecorators(AuthMode('machine'), ApiBearerAuth());

export const SkipTwoFactorSetup = () => SetMetadata(SKIP_TWO_FACTOR_SETUP_KEY, true);
export const SkipPhoneVerification = () => SetMetadata(SKIP_PHONE_VERIFICATION_KEY, true);
export const SkipPasswordExpiry = () => SetMetadata(SKIP_PASSWORD_EXPIRY_KEY, true);
