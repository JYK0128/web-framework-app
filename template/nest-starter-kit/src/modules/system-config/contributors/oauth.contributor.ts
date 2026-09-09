import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { SystemConfigKey } from '#/entities/system-config/system-config.entity';
import { type GetSystemConfigResponseDto, OAuthConfigDto } from '#/modules/system-config/dto';
import type { PublicConfigContext, PublicConfigContributor } from '#/modules/system-config/registry';

export interface PublicOAuthProviders {
  google: boolean
  kakao: boolean
  naver: boolean
  [key: string]: boolean | undefined
}

@Injectable()
export class OAuthPublicConfigContributor implements PublicConfigContributor<unknown, OAuthConfigDto> {
  readonly key = SystemConfigKey.OAUTH;

  verify(raw: unknown): OAuthConfigDto {
    return plainToInstance(OAuthConfigDto, (raw as object) ?? {});
  }

  process(
    verified: OAuthConfigDto,
    _context: PublicConfigContext,
    response: GetSystemConfigResponseDto,
  ): void {
    const oauthStatus: PublicOAuthProviders = {
      google: Boolean(verified.google?.enabled),
      kakao: Boolean(verified.kakao?.enabled),
      naver: Boolean(verified.naver?.enabled),
    };

    for (const [key, val] of Object.entries(verified)) {
      if (val && typeof val === 'object' && typeof val.enabled === 'boolean') {
        oauthStatus[key] = val.enabled;
      }
    }

    response.oauth = oauthStatus;
  }
}
