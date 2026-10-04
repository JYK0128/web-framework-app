import { HttpStatus, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { decrypt, hmac } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { env } from '#/env';
import { AppEntityManager } from '#/infra/database/entity-manager';
import { FindIdCommand } from '#/modules/auth/commands/find-id.command';
import type { FindIdResponseDto } from '#/modules/auth/dto/account-recovery.dto';

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
    if (users.length === 0) return { items: [] };

    const accounts = await this.em.find(Account, { user: { $in: users.map(({ id }) => id) } });
    const accountProvidersByUser = new Map<string, string[]>();
    for (const account of accounts) {
      const providers = accountProvidersByUser.get(account.user.id) ?? [];
      providers.push(account.providerId);
      accountProvidersByUser.set(account.user.id, providers);
    }

    const items = users.flatMap((user) => {
      if (!user.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      const maskedEmail = maskEmail(decrypt(user.profile.emailEncrypted, env.PII_ENCRYPTION_KEY));
      return (accountProvidersByUser.get(user.id) ?? []).map((provider) => ({ maskedEmail, provider }));
    });
    return { items };
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  return `${name.slice(0, 2)}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}
