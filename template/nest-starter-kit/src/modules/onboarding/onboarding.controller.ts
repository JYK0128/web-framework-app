import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommandBus, EventBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';

import { Bypass, BypassPolicy } from '#/common/decorators/bypass.decorator';
import { SwaggerApiResponse } from '#/common/decorators/swagger-api-response.decorator';

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

    return {
      ok: true,
      emailVerified: result.emailVerified,
    };
  }
}
