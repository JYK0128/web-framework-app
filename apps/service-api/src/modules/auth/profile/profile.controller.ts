import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrincipalContext } from '@pkg/server-core/http/contexts';
import { NoStore, Permissions, SkipPasswordExpiry, SkipPhoneVerification, SkipTwoFactorSetup, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';
import { ServicePermission } from '@pkg/shared';

import { MeQuery } from '~/modules/auth/profile/me.query';
import { MeRequestDto } from '~/modules/auth/profile/me.request.dto';
import { MeResponseDto } from '~/modules/auth/profile/me.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthProfileController {
  constructor(private readonly queryBus: QueryBus,
    private readonly principalContext: PrincipalContext) {}

  @Get('me')
  @Permissions(ServicePermission.customer.read)
  @SkipPasswordExpiry()
  @SkipPhoneVerification()
  @SkipTwoFactorSetup()
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'AuthController_me_v1', summary: '현재 로그인한 사용자 프로필 정보 조회' })
  @SwaggerApiResponse(MeResponseDto)
  async me(
    @Query() query: MeRequestDto,
  ): Promise<MeResponseDto> {
    const user = this.principalContext.ensureUser();
    return this.queryBus.execute<MeQuery, MeResponseDto>(
      new MeQuery({ userId: user.id, query }),
    );
  }
}
