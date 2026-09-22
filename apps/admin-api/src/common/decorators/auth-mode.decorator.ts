import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const AUTH_MODE_KEY = 'authMode';
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
