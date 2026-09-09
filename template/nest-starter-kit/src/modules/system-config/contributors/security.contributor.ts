import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { type GetSystemConfigResponseDto, SecurityConfigDto } from '#/modules/system-config/dto';
import type { PublicConfigContext, PublicConfigContributor } from '#/modules/system-config/registry';

export interface VerifiedSecurityConfig {
  allowRegistration: boolean
  allowCredentialRegistration: boolean
  security: SecurityConfigDto
}

@Injectable()
export class SecurityPublicConfigContributor implements PublicConfigContributor<unknown, VerifiedSecurityConfig> {
  readonly key = SystemConfigKey.SECURITY;

  verify(raw: unknown): VerifiedSecurityConfig {
    const security = plainToInstance(SecurityConfigDto, raw as object);
    const allowRegistration = security.registration.allowRegistration;
    const allowCredentialRegistration = security.registration.allowCredentialRegistration === true;

    return {
      allowRegistration,
      allowCredentialRegistration,
      security,
    };
  }

  process(
    verified: VerifiedSecurityConfig,
    _context: PublicConfigContext,
    response: GetSystemConfigResponseDto,
  ): void {
    response.allowRegistration = verified.allowRegistration;
    response.allowCredentialRegistration = verified.allowCredentialRegistration;
  }
}
