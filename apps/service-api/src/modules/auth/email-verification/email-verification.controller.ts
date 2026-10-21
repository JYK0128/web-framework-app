import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NoStore, Public, SwaggerApiResponse, UserAuth } from '@pkg/server-core/http/decorators';

import { RequestEmailVerificationCommand } from '~/modules/auth/email-verification/request-email-verification.command';
import { RequestEmailVerificationRequestDto } from '~/modules/auth/email-verification/request-email-verification.request.dto';
import { RequestEmailVerificationResponseDto } from '~/modules/auth/email-verification/request-email-verification.response.dto';
import { VerifyEmailCommand } from '~/modules/auth/email-verification/verify-email.command';
import { VerifyEmailRequestDto } from '~/modules/auth/email-verification/verify-email.request.dto';
import { VerifyEmailResponseDto } from '~/modules/auth/email-verification/verify-email.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthEmailVerificationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Public()
  @Post('email/challenge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_requestEmailVerification_v1', summary: '이메일 인증 메일 요청' })
  @SwaggerApiResponse(RequestEmailVerificationResponseDto)
  requestEmailVerification(@Body() dto: RequestEmailVerificationRequestDto): Promise<RequestEmailVerificationResponseDto> {
    return this.commandBus.execute(new RequestEmailVerificationCommand(dto));
  }

  @Public()
  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ operationId: 'AuthController_verifyEmail_v1', summary: '이메일 인증 완료' })
  @SwaggerApiResponse(VerifyEmailResponseDto)
  verifyEmail(@Body() dto: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    return this.commandBus.execute(new VerifyEmailCommand(dto));
  }
}
