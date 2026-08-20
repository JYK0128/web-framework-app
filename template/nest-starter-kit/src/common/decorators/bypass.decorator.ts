import { SetMetadata } from '@nestjs/common';

import { defineEnum } from '#/common/dto/enum';

export const BypassPolicy = defineEnum('BypassPolicy', {
  PERMISSION: 'permission',
  TERM: 'term',
  EMAIL_VERIFICATION: 'email_verification',
} as const);

export type BypassPolicy = (typeof BypassPolicy)[keyof typeof BypassPolicy];
export type BypassPolicies = readonly [BypassPolicy, ...BypassPolicy[]];

export const BYPASS_KEY = 'bypass';

export const Bypass = (...policies: BypassPolicies) => SetMetadata(BYPASS_KEY, policies);
