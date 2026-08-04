import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard } from '@nestjs/passport';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { CurrentUser } from '#/common/decorators/current-user.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { Skip2FA } from '#/common/decorators/skip-2fa.decorator';
import { getCookieOptions } from '#/common/session/cookie.config';
import { SessionStore } from '#/common/session/session.store';
import { env } from '#/env';

import { Generate2FACommand } from './commands/generate-2fa.command';
import { RegisterCommand } from './commands/register.command';
import { TurnOff2FACommand } from './commands/turn-off-2fa.command';
import { TurnOn2FACommand } from './commands/turn-on-2fa.command';
import { Verify2FACommand } from './commands/verify-2fa.command';
import type { CurrentUserResponseDto } from './dto/current-user.response.dto';
import { LoginRequestDto } from './dto/login.request.dto';
import { RegisterRequestDto } from './dto/register.request.dto';
import { TurnOn2FARequestDto } from './dto/turn-on-2fa.request.dto';
import { Verify2FARequestDto } from './dto/verify-2fa.request.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly sessionStore: SessionStore,
    private readonly cls: ClsService,
  ) {}

  private async establishSession(request: Request, userId: string): Promise<Date> {
    await this.sessionStore.linkAnonymousUser(userId);

    await new Promise<void>((resolve, reject) => {
      request.session.regenerate((regenerateError: unknown) => {
        if (regenerateError) {
          reject(regenerateError instanceof Error ? regenerateError : new Error('Failed to regenerate session'));
          return;
        }

        if (this.cls.isActive()) this.cls.set('sessionId', request.sessionID);
        resolve();
      });
    });

    const expiresAt = request.session.cookie.expires ?? new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000);
    await this.sessionStore.saveAuthenticatedSession(request.sessionID, userId, expiresAt);
    return expiresAt;
  }

  private expireSession(request: Request, response: Response): Promise<void> {
    return new Promise((resolve, reject) => {
      request.session.destroy((destroyError) => {
        if (destroyError) {
          reject(destroyError instanceof Error ? destroyError : new Error('Failed to destroy session'));
          return;
        }

        response.clearCookie(env.COOKIE_NAME, getCookieOptions());
        resolve();
      });
    });
  }

  @Post('register')
  @Public()
  @ApiBody({ type: RegisterRequestDto })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() input: RegisterRequestDto,
    @Req() request: Request,
  ) {
    const user = await this.commandBus.execute(new RegisterCommand(input));
    const expiresAt = await this.establishSession(request, user.id);

    return {
      user,
      expiresAt: expiresAt.toISOString(),
    };
  }

  @Post('login')
  @Public()
  @UseGuards(AuthGuard('local'))
  @ApiBody({ type: LoginRequestDto })
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() request: Request,
  ) {
    const user = request.user as CurrentUserResponseDto;
    const expiresAt = await this.establishSession(request, user.id);

    return {
      user,
      expiresAt: expiresAt.toISOString(),
    };
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() request: Request, @Res() response: Response) {
    const user = request.user as CurrentUserResponseDto;
    await this.establishSession(request, user.id);

    // Redirect to frontend after successful login
    return response.redirect('/');
  }

  @Get('me')
  @ApiCookieAuth('auth_session')
  getCurrentUser(@CurrentUser() user: CurrentUserResponseDto) {
    return { user };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.expireSession(request, response);

    return { ok: true };
  }

  @Post('2fa/generate')
  @Skip2FA()
  @HttpCode(HttpStatus.OK)
  async generate2FA(@CurrentUser() user: CurrentUserResponseDto) {
    return this.commandBus.execute(new Generate2FACommand(user));
  }

  @Post('2fa/turn-on')
  @Skip2FA()
  @ApiBody({ type: TurnOn2FARequestDto })
  @HttpCode(HttpStatus.OK)
  async turnOn2FA(
    @CurrentUser() user: CurrentUserResponseDto,
    @Body() input: TurnOn2FARequestDto,
  ) {
    await this.commandBus.execute(new TurnOn2FACommand(user, input));

    return { ok: true };
  }

  @Post('2fa/turn-off')
  @HttpCode(HttpStatus.OK)
  async turnOff2FA(@CurrentUser() user: CurrentUserResponseDto) {
    await this.commandBus.execute(new TurnOff2FACommand(user));
    return { ok: true };
  }

  @Post('2fa/verify')
  @Skip2FA()
  @ApiBody({ type: Verify2FARequestDto })
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @CurrentUser() user: CurrentUserResponseDto,
    @Body() input: Verify2FARequestDto,
  ) {
    await this.commandBus.execute(new Verify2FACommand(user, input));

    return { ok: true };
  }
}
