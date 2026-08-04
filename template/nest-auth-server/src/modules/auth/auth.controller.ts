import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { Public } from '#/common/decorators/public.decorator';
import { ZodValidationPipe } from '#/common/pipes/zod-validation.pipe';

import { type LoginInput, loginRequestSchemaRef, loginSchema, type RegisterInput, registerRequestSchemaRef, registerSchema } from './auth.schemas';
import type { PublicUser } from './auth.types';
import { LoginCommand } from './commands/login.command';
import { LogoutCommand } from './commands/logout.command';
import { RegisterCommand } from './commands/register.command';
import { CurrentUser } from './current-user.decorator';
import { clearSessionCookie, readSessionToken, setSessionCookie } from './session-cookie';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post('register')
  @Public()
  @ApiBody({ schema: registerRequestSchemaRef })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) input: RegisterInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.commandBus.execute(new RegisterCommand(input));
    setSessionCookie(response, result.session.token, result.session.expiresAt);

    return {
      user: result.user,
      expiresAt: result.session.expiresAt.toISOString(),
    };
  }

  @Post('login')
  @Public()
  @ApiBody({ schema: loginRequestSchemaRef })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) input: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.commandBus.execute(new LoginCommand(input));
    setSessionCookie(response, result.session.token, result.session.expiresAt);

    return {
      user: result.user,
      expiresAt: result.session.expiresAt.toISOString(),
    };
  }

  @Get('me')
  @ApiCookieAuth('auth_session')
  getCurrentUser(@CurrentUser() user: PublicUser) {
    return { user };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.commandBus.execute(new LogoutCommand(readSessionToken(request)));
    clearSessionCookie(response);

    return { ok: true };
  }
}
