import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const AUTH_MODE_KEY = 'authMode';
export const ALLOW_TWO_FACTOR_ENROLLMENT_KEY = 'allowTwoFactorEnrollment';
export const ALLOW_UNVERIFIED_IDENTITY_KEY = 'allowUnverifiedIdentity';
// Internal reflection metadata key; it never contains a credential.
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
export const ALLOW_PASSWORD_EXPIRED_KEY = 'allowExpiredAuth';
const SWAGGER_API_OPERATION_KEY = 'swagger/apiOperation';

export type AuthMode = 'public' | 'user' | 'machine';

export const AuthMode = (mode: AuthMode) => SetMetadata(AUTH_MODE_KEY, mode);

const PublicSwagger = (): MethodDecorator => (target, propertyKey, descriptor) => {
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

export const AllowTwoFactorEnrollment = () => SetMetadata(ALLOW_TWO_FACTOR_ENROLLMENT_KEY, true);
export const AllowUnverifiedIdentity = () => SetMetadata(ALLOW_UNVERIFIED_IDENTITY_KEY, true);
export const AllowPasswordExpired = () => SetMetadata(ALLOW_PASSWORD_EXPIRED_KEY, true);
