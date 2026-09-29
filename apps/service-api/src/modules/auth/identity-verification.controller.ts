import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AllowTwoFactorEnrollment, AllowUnverifiedIdentity, UserAuth } from '#/common/decorators/auth-mode.decorator';
import { NoStore } from '#/common/decorators/no-store.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { VerifyIdentityCommand } from '#/modules/auth/commands/verify-identity.command';
import { VerifyIdentityRequestDto, VerifyIdentityResponseDto } from '#/modules/auth/dto/verify-identity.dto';

@ApiTags('Auth')
@UserAuth()
@NoStore()
@Controller('identity-verification')
export class IdentityVerificationController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @AllowUnverifiedIdentity()
  @AllowTwoFactorEnrollment()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'PortOne 본인인증 결과 검증 및 계정에 반영' })
  @SwaggerApiResponse(VerifyIdentityResponseDto)
  verify(@Body() dto: VerifyIdentityRequestDto): Promise<VerifyIdentityResponseDto> {
    return this.commandBus.execute(new VerifyIdentityCommand(dto));
  }
}
