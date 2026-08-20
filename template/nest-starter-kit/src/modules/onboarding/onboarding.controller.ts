import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { SessionContext } from '#/common/contexts/session.context';
import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SessionStore } from '#/common/stores/session.store';

import { IssueEmailVerificationCommand, VerifyEmailCommand } from './commands';
import { IssueEmailVerificationResponseDto, VerifyEmailRequestDto, VerifyEmailResponseDto } from './dto';

@ApiTags('onboarding')
@Controller('onboarding')
@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION)
export class OnboardingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly sessionContext: SessionContext,
    private readonly sessionStore: SessionStore,
  ) {}

  @Post('email/send-verification')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(IssueEmailVerificationResponseDto)
  async issueEmailVerification(): Promise<IssueEmailVerificationResponseDto> {
    return this.commandBus.execute(new IssueEmailVerificationCommand());
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(VerifyEmailResponseDto)
  async verifyEmail(
    @Body() input: VerifyEmailRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<VerifyEmailResponseDto> {
    const result = await this.commandBus.execute(new VerifyEmailCommand(input));
    await this.sessionStore.destroyAll(user.id);
    await this.sessionContext.establish({
      ...user,
      emailVerified: result.emailVerified,
    });

    return {
      ok: true,
      emailVerified: result.emailVerified,
    };
  }
}
