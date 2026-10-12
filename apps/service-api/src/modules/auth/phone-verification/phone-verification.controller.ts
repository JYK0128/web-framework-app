import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { SkipPasswordExpiry, SkipPhoneVerification, SkipTwoFactorSetup, UserAuth } from '#/core/http/decorators/auth-mode.decorator';
import { NoStore } from '#/core/http/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/core/http/decorators/swagger-api-response.decorator';
import { VerifyPhoneNumberCommand } from '#/modules/auth/phone-verification/verify-phone-number.command';
import { VerifyPhoneNumberRequestDto } from '#/modules/auth/phone-verification/verify-phone-number.request.dto';
import { VerifyPhoneNumberResponseDto } from '#/modules/auth/phone-verification/verify-phone-number.response.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('auth')
export class AuthPhoneVerificationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @SkipPasswordExpiry()
  @SkipPhoneVerification()
  @SkipTwoFactorSetup()
  @ApiBearerAuth()
  @ApiOperation({ operationId: 'AuthController_verifyPhoneNumber_v1', summary: 'PortOne 전화번호 인증 결과 검증 및 계정에 반영' })
  @SwaggerApiResponse(VerifyPhoneNumberResponseDto)
  verifyPhoneNumber(@Body() dto: VerifyPhoneNumberRequestDto): Promise<VerifyPhoneNumberResponseDto> {
    return this.commandBus.execute(new VerifyPhoneNumberCommand(dto));
  }
}
