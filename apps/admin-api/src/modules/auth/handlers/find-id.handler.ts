import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hmac } from '@pkg/shared/server';

import { Account, User } from '#/core/database/entities/auth';
import { AppEntityManager } from '#/core/database/entity-manager';
import { env } from '#/env';
import { FindIdItemDto, FindIdResponseDto } from '#/modules/auth/dto';
import { FindIdQuery } from '#/modules/auth/queries';

@Injectable()
@QueryHandler(FindIdQuery)
export class FindIdHandler implements IQueryHandler<FindIdQuery, FindIdResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute({ input }: FindIdQuery): Promise<FindIdResponseDto> {
    const users = await this.em.find(User, { profile: { name: input.name.trim(), phoneNumberHash: hmac(input.phoneNumber, env.PII_HASH_KEY) } }, { populate: ['profile'] });
    if (users.length === 0) return FindIdResponseDto.parse({ items: [] });
    const accounts = await this.em.find(Account, { user: { $in: users.map(({ id }) => id) } });
    const providersByUser = new Map<string, string[]>();
    for (const account of accounts) {
      const providers = providersByUser.get(account.user.id) ?? [];
      providers.push(account.providerId);
      providersByUser.set(account.user.id, providers);
    }

    const items = users.flatMap((user) => {
      const profile = user.profile;
      if (!profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      return (providersByUser.get(user.id) ?? []).map((provider) => FindIdItemDto.parseEntity(profile, provider, env.PII_ENCRYPTION_KEY));
    });
    return FindIdResponseDto.parse({ items });
  }
}
