import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoStore, Public, SkipPasswordExpiry, SkipTwoFactorSetup, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';

import { DisableTwoFactorCommand } from '~/modules/auth/two-factor/disable-two-factor.command';
import { DisableTwoFactorRequestDto } from '~/modules/auth/two-factor/disable-two-factor.request.dto';
import { DisableTwoFactorResponseDto } from '~/modules/auth/two-factor/disable-two-factor.response.dto';
import { EnableTwoFactorCommand } from '~/modules/auth/two-factor/enable-two-factor.command';
import { EnableTwoFactorRequestDto } from '~/modules/auth/two-factor/enable-two-factor.request.dto';
import { EnableTwoFactorResponseDto } from '~/modules/auth/two-factor/enable-two-factor.response.dto';
import { GenerateTwoFactorCommand } from '~/modules/auth/two-factor/generate-two-factor.command';
import { GenerateTwoFactorRequestDto } from '~/modules/auth/two-factor/generate-two-factor.request.dto';
import { GenerateTwoFactorResponseDto } from '~/modules/auth/two-factor/generate-two-factor.response.dto';
import { TwoFactorLoginCommand } from '~/modules/auth/two-factor/two-factor-login.command';
import { TwoFactorLoginRequestDto } from '~/modules/auth/two-factor/two-factor-login.request.dto';
import { TwoFactorLoginResponseDto } from '~/modules/auth/two-factor/two-factor-login.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthTwoFactorController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_completeTwoFactorLogin_v1', summary: '2단계 인증 코드로 로그인 완료' })
  @SwaggerApiResponse(TwoFactorLoginResponseDto)
  async completeTwoFactorLogin(
    @Body() dto: TwoFactorLoginRequestDto,
  ): Promise<TwoFactorLoginResponseDto> {
    return this.commandBus.execute<TwoFactorLoginCommand, TwoFactorLoginResponseDto>(
      new TwoFactorLoginCommand(dto),
    );
  }

  @Post('2fa/setup')
  @SkipPasswordExpiry()
  @SkipTwoFactorSetup()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_generateTwoFactor_v1', summary: '2단계 인증 코드 생성' })
  @SwaggerApiResponse(GenerateTwoFactorResponseDto)
  async generateTwoFactor(): Promise<GenerateTwoFactorResponseDto> {
    return this.commandBus.execute(new GenerateTwoFactorCommand(new GenerateTwoFactorRequestDto()));
  }

  @Post('2fa/enable')
  @SkipPasswordExpiry()
  @SkipTwoFactorSetup()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_enableTwoFactor_v1', summary: '2단계 인증 켜기' })
  @SwaggerApiResponse(EnableTwoFactorResponseDto)
  async enableTwoFactor(@Body() dto: EnableTwoFactorRequestDto): Promise<EnableTwoFactorResponseDto> {
    return this.commandBus.execute(new EnableTwoFactorCommand(dto));
  }

  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_disableTwoFactor_v1', summary: '2단계 인증 끄기' })
  @SwaggerApiResponse(DisableTwoFactorResponseDto)
  async disableTwoFactor(): Promise<DisableTwoFactorResponseDto> {
    return this.commandBus.execute(new DisableTwoFactorCommand(new DisableTwoFactorRequestDto()));
  }
}
