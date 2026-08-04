import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PassportStrategy } from '@nestjs/passport';
import { type Profile, Strategy, type VerifyCallback } from 'passport-google-oauth20';

import { env } from '#/env';
import { OAuthLoginCommand } from '#/modules/auth/commands/oauth-login.command';
import type { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly commandBus: CommandBus) {
    super({
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback): Promise<void> {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Google profile must include an email address'), undefined);
      }

      const user: CurrentUserResponseDto = await this.commandBus.execute(
        new OAuthLoginCommand({
          provider: 'google',
          accountId: profile.id,
          email,
          name: profile.displayName,
          accessToken,
          refreshToken,
        }),
      );

      done(null, user);
    }
    catch (error) {
      done(error, undefined);
    }
  }
}
