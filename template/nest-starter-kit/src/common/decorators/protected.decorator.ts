import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';

export const Policy = {
  SESSION: 'session',
  TWO_FACTOR: 'two_factor',
} as const;

export type ProtectionPolicy = (typeof Policy)[keyof typeof Policy];
export type ProtectionPolicies = readonly [ProtectionPolicy, ...ProtectionPolicy[]];

export const PROTECTED_KEY = 'auth:protected';

const COOKIE_NAMES: Record<ProtectionPolicy, string> = {
  [Policy.SESSION]: 'auth_session',
  [Policy.TWO_FACTOR]: 'two_factor',
};

export const Protected = (...policies: ProtectionPolicies) => applyDecorators(
  SetMetadata(PROTECTED_KEY, policies),
  ...policies.map((policy) => ApiCookieAuth(COOKIE_NAMES[policy])),
);
