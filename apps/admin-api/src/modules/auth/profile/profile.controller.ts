import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrincipalContext } from '#/core/http/contexts/principal.context';
import { SkipPasswordExpiry, SkipPhoneVerification, SkipTwoFactorSetup, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { NoStore } from '#/core/http/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { MeQuery } from '#/modules/auth/profile/me.query';
import { MeRequestDto } from '#/modules/auth/profile/me.request.dto';
import { MeResponseDto } from '#/modules/auth/profile/me.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthProfileController {
  constructor(private readonly queryBus: QueryBus,
    private readonly principalContext: PrincipalContext) {}

  @Get('me')
  @SkipPasswordExpiry()
  @SkipTwoFactorSetup()
  @SkipPhoneVerification()
  @ApiOperation({ operationId: 'AuthController_me_v1', summary: '내 정보 조회' })
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
