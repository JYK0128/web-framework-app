import { HttpStatus, Injectable } from '@nestjs/common';
import { type IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ApplicationError, maskEmail, normalizePhoneNumber } from '@pkg/shared/common';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { AppEntityManager } from '#/infra/database/entity-manager';
import type { FindIdItemDto, FindIdResponseDto } from '#/modules/auth/dto/find-id.response.dto';
import { FindIdQuery } from '#/modules/auth/queries/find-id.query';

@Injectable()
@QueryHandler(FindIdQuery)
export class FindIdHandler implements IQueryHandler<FindIdQuery, FindIdResponseDto> {
  constructor(private readonly em: AppEntityManager) {}

  async execute(query: FindIdQuery): Promise<FindIdResponseDto> {
    const users = await this.identifyUsers(query.input.name, query.input.phoneNumber);
    this.verify(users);
    return this.process(users);
  }

  private async identifyUsers(name: string, rawPhone?: string): Promise<User[]> {
    const trimmedName = name.trim();
    if (rawPhone && rawPhone.trim().length > 0) {
      const phoneNumber = normalizePhoneNumber(rawPhone);
      return this.em.find(User, {
        name: trimmedName,
        phoneNumber,
      }, {
        populate: ['accounts'],
        orderBy: { createdAt: 'DESC' },
      });
    }

    return this.em.find(User, {
      name: trimmedName,
    }, {
      populate: ['accounts'],
      orderBy: { createdAt: 'DESC' },
    });
  }

  private verifyUsersFound(users: User[]): void {
    if (users.length === 0) {
      throw new ApplicationError({
        code: 'USER_NOT_FOUND',
        status: HttpStatus.NOT_FOUND,
        message: '일치하는 계정 정보를 찾을 수 없습니다.',
      });
    }
  }

  private verify(users: User[]): void {
    this.verifyUsersFound(users);
  }

  private process(users: User[]): FindIdResponseDto {
    const items: FindIdItemDto[] = users.map((user) => {
      let provider = 'credential';
      const nonCredentialAccount = user.accounts.getItems().find((acc) => acc.providerId !== Account.PROVIDER_CREDENTIAL);
      if (nonCredentialAccount) {
        provider = nonCredentialAccount.providerId;
      }

      return {
        maskedEmail: maskEmail(user.email),
        provider,
        createdAt: user.createdAt ?? new Date(),
      };
    });

    return {
      ok: true,
      items,
    };
  }
}
