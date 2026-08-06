import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiBody, ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import type { Request, Response } from 'express';
import { ClsService } from 'nestjs-cls';

import { ApiOkResponseData } from '#/common/decorators/api-ok-response-data.decorator';
import { Public } from '#/common/decorators/public.decorator';
import { getCookieOptions } from '#/common/session/cookie.config';
import { SessionStore } from '#/common/session/session.store';
import { env } from '#/env';
import { TermsAgreeCommand } from '#/modules/auth/commands/terms-agree.command';
import { TermsCreateChallengeCommand } from '#/modules/auth/commands/terms-create-challenge.command';
import { TermsAgreeRequestDto } from '#/modules/auth/dto/terms-agree.request.dto';
import { TermsAgreeResponseDto } from '#/modules/auth/dto/terms-agree.response.dto';
import { TermsChallengeListQuery } from '#/modules/auth/queries/terms-challenge-list.query';
import { TermsCheckAgreementsQuery } from '#/modules/auth/queries/terms-check-agreements.query';

import { AccountLinkCommand, AccountUnlinkCommand, Create2FAChallengeCommand, Generate2FACommand, LoginCredentialCommand, LoginOAuthCommand, LogoutCommand, TurnOff2FACommand, TurnOn2FACommand, UserRegisterCommand, UserUnregisterCommand, Verify2FAChallengeCommand } from './commands';
import { AccountLinkRequestDto, AccountLinkResponseDto, AccountUnlinkRequestDto, AccountUnlinkResponseDto, Generate2FAResponseDto, LoginCredentialRequestDto, LoginCredentialResponseDto, LogoutResponseDto, TermsChallengeListResponseDto, TurnOff2FAResponseDto, TurnOn2FARequestDto, TurnOn2FAResponseDto, UserProfileResponseDto, UserProfileSessionResponseDto, UserRegisterRequestDto, UserRegisterResponseDto, UserUnregisterResponseDto, Verify2FAChallengeRequestDto, Verify2FAChallengeResponseDto } from './dto';
import { UserProfileQuery } from './queries';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly sessionStore: SessionStore,
    private readonly cls: ClsService,
  ) {}

  private async establishSession(request: Request, userId: string): Promise<Date | null> {
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

    const expiresAt = env.SESSION_TTL_SECONDS === -1
      ? null
      : (request.session.cookie.expires ?? new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000));
    await this.sessionStore.saveAuthenticatedSession(request.sessionID, userId, expiresAt);
    return expiresAt;
  }

  private clearTemporaryCookies(response: Response): void {
    response.clearCookie('two_factor');
    response.clearCookie('terms_token');
  }

  private expireSession(request: Request, response: Response): Promise<void> {
    this.clearTemporaryCookies(response);
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
  @ApiBody({ type: UserRegisterRequestDto })
  @HttpCode(HttpStatus.CREATED)
  @ApiOkResponseData(UserRegisterResponseDto)
  async userRegister(
    @Body() input: UserRegisterRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserRegisterResponseDto> {
    this.clearTemporaryCookies(response);
    const user = await this.commandBus.execute(
      new UserRegisterCommand(input),
    );
    return this.checkTermsAndEstablishSession(request, response, user);
  }

  @Post('login')
  @Public()
  @ApiBody({ type: LoginCredentialRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(LoginCredentialResponseDto)
  async loginCredential(
    @Body() input: LoginCredentialRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LoginCredentialResponseDto> {
    this.clearTemporaryCookies(response);
    const user = await this.commandBus.execute(
      new LoginCredentialCommand(input),
    );

    if (user.twoFactorEnabled) {
      const responseDto = await this.commandBus.execute(
        new Create2FAChallengeCommand({ userId: user.id }),
      );

      response.cookie('two_factor', responseDto.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return {
        ok: true,
        twoFactorRedirect: true,
      };
    }

    return this.checkTermsAndEstablishSession(request, response, user);
  }

  @Get('google')
  @Public()
  async googleAuth(@Req() request: Request, @Res() response: Response) {
    const protocol = (request.headers['x-forwarded-proto'] as string | undefined) || request.protocol;
    const host = request.get('host');
    const redirectUri = `${protocol}://${host}/auth/google/callback`;

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.append('client_id', env.GOOGLE_CLIENT_ID);
    url.searchParams.append('redirect_uri', redirectUri);
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'email profile');

    response.redirect(url.toString());
  }

  @Get('google/callback')
  @Public()
  async googleAuthRedirect(@Req() request: Request, @Res() response: Response) {
    const { code } = request.query;
    if (!code || typeof code !== 'string') {
      return response.redirect('/login?error=invalid_code');
    }

    const protocol = (request.headers['x-forwarded-proto'] as string | undefined) || request.protocol;
    const host = request.get('host');
    const redirectUri = `${protocol}://${host}/auth/google/callback`;

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return response.redirect('/login?error=oauth_exchange_failed');
    }

    const tokenData = await tokenResponse.json() as { access_token: string, refresh_token?: string };

    // Fetch user profile
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileResponse.ok) {
      return response.redirect('/login?error=oauth_profile_failed');
    }

    const profile = await profileResponse.json() as { id: string, email?: string, name?: string };

    if (!profile.email) {
      return response.redirect('/login?error=no_email_provided');
    }

    const user = await this.commandBus.execute(
      new LoginOAuthCommand({
        provider: 'google',
        accountId: profile.id,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      }),
    );

    if (user.twoFactorEnabled) {
      const responseDto = await this.commandBus.execute(
        new Create2FAChallengeCommand({ userId: user.id }),
      );

      response.cookie('two_factor', responseDto.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return response.redirect('/login/2fa'); // Redirect to 2FA page instead of home
    }

    const checkTermsResult = await this.queryBus.execute(
      new TermsCheckAgreementsQuery({ userId: user.id }),
    );
    if (checkTermsResult.hasUnagreed) {
      const termsChallenge = await this.commandBus.execute(
        new TermsCreateChallengeCommand({ userId: user.id }),
      );

      response.cookie('terms_token', termsChallenge.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return response.redirect('/login/terms');
    }

    this.clearTemporaryCookies(response);
    await this.establishSession(request, user.id);

    // Redirect to frontend after successful login
    return response.redirect('/');
  }

  @Get('me')
  @ApiCookieAuth('auth_session')
  @ApiOkResponseData(UserProfileSessionResponseDto)
  async userProfile(
    @Req() request: Request,
  ): Promise<UserProfileSessionResponseDto> {
    const user = await this.queryBus.execute<UserProfileQuery, UserProfileResponseDto>(
      new UserProfileQuery({}),
    );
    const expiresAt = request.session.cookie.expires
      ?? (env.SESSION_TTL_SECONDS === -1 ? null : new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000));
    return {
      user,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    };
  }

  @Post('link-account')
  @ApiBody({ type: AccountLinkRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(AccountLinkResponseDto)
  async accountLink(
    @Body() input: AccountLinkRequestDto,
  ): Promise<AccountLinkResponseDto> {
    return this.commandBus.execute(
      new AccountLinkCommand(input),
    );
  }

  @Post('unlink-account')
  @ApiBody({ type: AccountUnlinkRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(AccountUnlinkResponseDto)
  async accountUnlink(
    @Body() input: AccountUnlinkRequestDto,
  ): Promise<AccountUnlinkResponseDto> {
    return this.commandBus.execute(
      new AccountUnlinkCommand(input),
    );
  }

  @Post('unregister')
  @ApiCookieAuth('auth_session')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(UserUnregisterResponseDto)
  async userUnregister(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<UserUnregisterResponseDto> {
    await this.commandBus.execute(
      new UserUnregisterCommand({}),
    );
    await this.expireSession(request, response);
    return { ok: true };
  }

  @Post('logout')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(LogoutResponseDto)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponseDto> {
    await this.commandBus.execute(
      new LogoutCommand(),
    );
    await this.expireSession(request, response);

    return { ok: true };
  }

  @Post('2fa/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(Generate2FAResponseDto)
  async generate2FA(): Promise<Generate2FAResponseDto> {
    return this.commandBus.execute(
      new Generate2FACommand({}),
    );
  }

  @Post('2fa/turn-on')
  @ApiBody({ type: TurnOn2FARequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(TurnOn2FAResponseDto)
  async turnOn2FA(
    @Body() input: TurnOn2FARequestDto,
  ): Promise<TurnOn2FAResponseDto> {
    await this.commandBus.execute(
      new TurnOn2FACommand(input),
    );

    return { ok: true };
  }

  @Post('2fa/turn-off')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(TurnOff2FAResponseDto)
  async turnOff2FA(): Promise<TurnOff2FAResponseDto> {
    await this.commandBus.execute(
      new TurnOff2FACommand({}),
    );
    return { ok: true };
  }

  @Post('2fa/verify')
  @Public()
  @ApiBody({ type: Verify2FAChallengeRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(Verify2FAChallengeResponseDto)
  async verify2FAChallenge(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() input: Verify2FAChallengeRequestDto,
  ): Promise<Verify2FAChallengeResponseDto> {
    const token = (request.cookies as Record<string, string>)['two_factor'] as string | undefined;
    if (!token) throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });

    input.token = token;
    const user = await this.commandBus.execute(
      new Verify2FAChallengeCommand(input),
    );

    // Clear temporary cookie
    response.clearCookie('two_factor');

    return this.checkTermsAndEstablishSession(request, response, user);
  }

  @Post('terms/agree')
  @Public()
  @ApiBody({ type: TermsAgreeRequestDto })
  @HttpCode(HttpStatus.OK)
  @ApiOkResponseData(TermsAgreeResponseDto)
  async agreeTerms(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body() input: TermsAgreeRequestDto,
  ): Promise<TermsAgreeResponseDto> {
    const token = (request.cookies as Record<string, string>)['terms_token'] as string | undefined;
    if (!token) throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });

    input.token = token;
    const user = await this.commandBus.execute(
      new TermsAgreeCommand(input),
    );

    // Clear temporary cookie
    response.clearCookie('terms_token');

    // Establish real session
    await this.establishSession(request, user.id);

    return { ok: true };
  }

  @Get('terms')
  @Public()
  @ApiOkResponseData(TermsChallengeListResponseDto)
  async getUnagreedTerms(
    @Req() request: Request,
  ): Promise<TermsChallengeListResponseDto> {
    const token = (request.cookies as Record<string, string>)['terms_token'] as string | undefined;
    if (!token) throw new ApplicationError({ code: 'INVALID_TOKEN', status: HttpStatus.BAD_REQUEST });

    return this.queryBus.execute(
      new TermsChallengeListQuery({ token }),
    );
  }

  private async checkTermsAndEstablishSession(
    request: Request,
    response: Response,
    user: UserProfileResponseDto,
  ): Promise<{ ok: boolean, termsRedirect?: boolean }> {
    const checkTermsResult = await this.queryBus.execute(
      new TermsCheckAgreementsQuery({ userId: user.id }),
    );

    if (checkTermsResult.hasUnagreed) {
      const termsChallenge = await this.commandBus.execute(
        new TermsCreateChallengeCommand({ userId: user.id }),
      );

      response.cookie('terms_token', termsChallenge.token, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      return {
        ok: true,
        termsRedirect: true,
      };
    }

    this.clearTemporaryCookies(response);
    await this.establishSession(request, user.id);

    return { ok: true };
  }
}
