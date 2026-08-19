import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { ClsService } from 'nestjs-cls';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { AuthTokenService } from '#/common/security/auth-token.service';
import { type AuthPrincipal } from '#/common/security/auth-token.types';
import { AuthUserService } from '#/common/security/auth-user.service';

import { IssueEmailVerificationCommand, VerifyEmailCommand } from './commands';
import { IssueEmailVerificationResponseDto, VerifyEmailRequestDto, VerifyEmailResponseDto } from './dto';
import { EmailVerificationCodeIssuedEvent } from './events';

@ApiTags('onboarding')
@Controller('onboarding')
@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM, BypassPolicy.USER_VERIFICATION)
export class OnboardingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly authTokenService: AuthTokenService,
    private readonly authUserService: AuthUserService,
    private readonly cls: ClsService,
  ) {}

  @Post('email/send-verification')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(IssueEmailVerificationResponseDto)
  async issueEmailVerification(): Promise<IssueEmailVerificationResponseDto> {
    const result = await this.commandBus.execute(new IssueEmailVerificationCommand());

    this.eventBus.publish(
      new EmailVerificationCodeIssuedEvent(result.email, result.code, result.expiresIn),
    );

    return {
      ok: true,
      expiresIn: result.expiresIn,
    };
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(VerifyEmailResponseDto)
  async verifyEmail(@Body() input: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    const result = await this.commandBus.execute(new VerifyEmailCommand(input));
    const user = this.cls.get<AuthPrincipal>('user');
    if (!user) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }

    const tokenFamilyId = this.cls.get<string | null>('tokenFamilyId');
    await this.authTokenService.cutoff(user.id);
    if (tokenFamilyId) {
      await this.authTokenService.revokeRefresh(tokenFamilyId);
    }

    const tokenPair = await this.authTokenService.issue(
      await this.getAuthPrincipal(user.id),
    );

    return {
      ok: true,
      emailVerified: result.emailVerified,
      ...tokenPair,
    };
  }

  private async getAuthPrincipal(userId: string): Promise<AuthPrincipal> {
    const principal = await this.authUserService.getAuthPrincipal(userId);
    if (!principal) {
      throw new ApplicationError({ code: 'AUTHENTICATION_REQUIRED', status: HttpStatus.UNAUTHORIZED });
    }
    return principal;
  }
}
