import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import type { AuthPrincipal } from 'express-session';

import { SessionContext } from '#/common/contexts/session.context';
import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';
import { SessionStore } from '#/common/stores/session.store';

import { IssueEmailChallengeCommand, type IssueEmailChallengeResult, IssuePhoneChallengeCommand, VerifyEmailCommand, VerifyPhoneCommand } from './commands';
import { IssueEmailChallengeResponseDto, IssuePhoneChallengeRequestDto, IssuePhoneChallengeResponseDto, VerifyEmailRequestDto, VerifyEmailResponseDto, VerifyPhoneRequestDto, VerifyPhoneResponseDto } from './dto';
import { EmailVerificationMailer } from './services';

@ApiTags('onboarding')
@Controller('onboarding')
@Bypass(BypassPolicy.PERMISSION, BypassPolicy.TERM, BypassPolicy.EMAIL_VERIFICATION, BypassPolicy.PHONE_VERIFICATION)
export class OnboardingController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly emailVerificationMailer: EmailVerificationMailer,
    private readonly sessionContext: SessionContext,
    private readonly sessionStore: SessionStore,
  ) {}

  @Post('email/challenge')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(IssueEmailChallengeResponseDto)
  async issueEmailChallenge(): Promise<IssueEmailChallengeResponseDto> {
    const result = await this.commandBus.execute<IssueEmailChallengeCommand, IssueEmailChallengeResult>(
      new IssueEmailChallengeCommand(),
    );
    await this.emailVerificationMailer.send(result);
    return {
      ok: result.ok,
      challengeId: result.challengeId,
      expiresIn: result.expiresIn,
    };
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

  @Post('phone/challenge')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(IssuePhoneChallengeResponseDto)
  async issuePhoneChallenge(
    @Body() input: IssuePhoneChallengeRequestDto,
  ): Promise<IssuePhoneChallengeResponseDto> {
    return this.commandBus.execute(new IssuePhoneChallengeCommand(input));
  }

  @Post('phone/verify')
  @HttpCode(HttpStatus.OK)
  @SwaggerApiResponse(VerifyPhoneResponseDto)
  async verifyPhone(
    @Body() input: VerifyPhoneRequestDto,
    @CurrentUser() user: AuthPrincipal,
  ): Promise<VerifyPhoneResponseDto> {
    const result = await this.commandBus.execute(new VerifyPhoneCommand(input));
    await this.sessionStore.destroyAll(user.id);
    await this.sessionContext.establish({
      ...user,
      phoneNumber: result.phoneNumber,
      phoneNumberVerified: result.phoneNumberVerified,
    });
    return result;
  }
}
