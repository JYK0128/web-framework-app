import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { LoginCommand } from '#/modules/auth/commands/login.command';
import type { CurrentUserResponseDto } from '#/modules/auth/dto/current-user.response.dto';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly commandBus: CommandBus) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<CurrentUserResponseDto> {
    return this.commandBus.execute(new LoginCommand({ email, password }));
  }
}
