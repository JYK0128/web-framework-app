import { EntityManager } from '@mikro-orm/core';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CommandHandler, type ICommandHandler } from '@nestjs/cqrs';
import { ApplicationError } from '@pkg/shared/common';
import { hash } from '@pkg/shared/server';

import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';
import { Term } from '#/entities/terms/term.entity';
import { UserTermAgreement } from '#/entities/terms/user-term-agreement.entity';
import { UserRegisterCommand } from '#/modules/auth/commands/user-register.command';
import { UserProfileResponseDto } from '#/modules/auth/dto/user-profile.response.dto';

const CREDENTIAL_PROVIDER = 'credential';

@Injectable()
@CommandHandler(UserRegisterCommand)
export class UserRegisterHandler implements ICommandHandler<UserRegisterCommand, UserProfileResponseDto> {
  constructor(@Inject(EntityManager) private readonly em: EntityManager) {}

  async execute(command: UserRegisterCommand): Promise<UserProfileResponseDto> {
    const { email, agreements } = command.input;
    const existingUser = await this.em.findOne(User, { email });
    if (existingUser) {
      throw new ApplicationError({ code: 'EMAIL_ALREADY_REGISTERED', status: HttpStatus.CONFLICT });
    }

    const user = new User();
    user.email = email;
    user.name = command.input.name;
    this.em.persist(user);

    const account = this.em.create(Account, {
      user,
      accountId: user.id,
      providerId: CREDENTIAL_PROVIDER,
      password: await hash(command.input.password),
    });
    this.em.persist(account);

    if (agreements && agreements.length > 0) {
      const agreeTermIds = agreements.filter((a) => a.isAgreed).map((a) => a.id);
      if (agreeTermIds.length > 0) {
        const terms = await this.em.find(
          Term,
          { id: { $in: agreeTermIds }, publishedAt: { $ne: null, $lte: new Date() } },
          { populate: ['termGroup'] },
        );

        for (const term of terms) {
          const agreement = this.em.create(UserTermAgreement, {
            user,
            term,
            agreedAt: new Date(),
          });
          this.em.persist(agreement);
        }
      }
    }

    await this.em.flush();

    return new UserProfileResponseDto(user);
  }
}
