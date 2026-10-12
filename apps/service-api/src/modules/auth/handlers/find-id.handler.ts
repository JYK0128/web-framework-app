import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hmac } from '@pkg/shared/server';

import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { FindIdCommand } from '#/modules/auth/commands/find-id.command';
import { FindIdItemDto, FindIdResponseDto } from '#/modules/auth/dto';

@Injectable()
@CommandHandler(FindIdCommand)
export class FindIdHandler implements ICommandHandler<FindIdCommand, FindIdResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(command: FindIdCommand): Promise<FindIdResponseDto> {
    const users = await this.em.find(User, {
      profile: {
        name: command.input.name.trim(),
        phoneNumberHash: hmac(command.input.phoneNumber, env.PII_HASH_KEY),
      },
    }, { populate: ['profile'] });
    if (users.length === 0) return FindIdResponseDto.parse({ items: [] });

    const accounts = await this.em.find(Account, { user: { $in: users.map(({ id }) => id) } });
    const accountProvidersByUser = new Map<string, string[]>();
    for (const account of accounts) {
      const providers = accountProvidersByUser.get(account.user.id) ?? [];
      providers.push(account.providerId);
      accountProvidersByUser.set(account.user.id, providers);
    }

    const items = users.flatMap((user) => {
      const profile = user.profile;
      if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      return (accountProvidersByUser.get(user.id) ?? []).map((provider) => FindIdItemDto.parseEntity(profile, provider, env.PII_ENCRYPTION_KEY));
    });
    return FindIdResponseDto.parse({ items });
  }
}
