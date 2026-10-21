import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoStore, Public, SkipPasswordExpiry, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';

import { ChangePasswordCommand } from '~/modules/auth/credential/change-password.command';
import { ChangePasswordRequestDto } from '~/modules/auth/credential/change-password.request.dto';
import { ChangePasswordResponseDto } from '~/modules/auth/credential/change-password.response.dto';
import { RequestPasswordResetCommand } from '~/modules/auth/credential/request-password-reset.command';
import { RequestPasswordResetRequestDto } from '~/modules/auth/credential/request-password-reset.request.dto';
import { RequestPasswordResetResponseDto } from '~/modules/auth/credential/request-password-reset.response.dto';
import { ResetPasswordCommand } from '~/modules/auth/credential/reset-password.command';
import { ResetPasswordRequestDto } from '~/modules/auth/credential/reset-password.request.dto';
import { ResetPasswordResponseDto } from '~/modules/auth/credential/reset-password.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthCredentialController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('password/reset/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_requestPasswordReset_v1', summary: '비밀번호 재설정 요청' })
  @SwaggerApiResponse(RequestPasswordResetResponseDto)
  requestPasswordReset(@Body() dto: RequestPasswordResetRequestDto): Promise<RequestPasswordResetResponseDto> {
    return this.commandBus.execute(new RequestPasswordResetCommand(dto));
  }

  @Public()
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_resetPassword_v1', summary: '비밀번호 재설정' })
  @SwaggerApiResponse(ResetPasswordResponseDto)
  resetPassword(@Body() dto: ResetPasswordRequestDto): Promise<ResetPasswordResponseDto> {
    return this.commandBus.execute(new ResetPasswordCommand(dto));
  }

  @Post('password/change')
  @SkipPasswordExpiry()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_changePassword_v1', summary: '비밀번호 변경' })
  @SwaggerApiResponse(ChangePasswordResponseDto)
  async changePassword(@Body() dto: ChangePasswordRequestDto): Promise<ChangePasswordResponseDto> {
    return this.commandBus.execute(new ChangePasswordCommand(dto));
  }
}
