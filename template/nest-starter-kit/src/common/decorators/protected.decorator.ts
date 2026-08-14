import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';

export const Policy = {
  TWO_FACTOR: 'two_factor',
} as const;

export type ProtectionPolicy = (typeof Policy)[keyof typeof Policy];
export type ProtectionPolicies = readonly [ProtectionPolicy, ...ProtectionPolicy[]];

export const PROTECTED_KEY = 'auth:protected';

export const Protected = (...policies: ProtectionPolicies) => applyDecorators(
  SetMetadata(PROTECTED_KEY, policies),
  ApiBearerAuth(),
);
