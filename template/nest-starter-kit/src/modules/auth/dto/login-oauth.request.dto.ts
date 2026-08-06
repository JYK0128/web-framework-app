import { IntersectionType } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

export class LoginOAuthRequestDto extends IntersectionType(
  DtoType(User, ['email', 'name'] as const),
  DtoType(Account, ['accountId', 'accessToken', 'refreshToken'] as const),
) {
  provider!: string;
  override accountId!: string;
  override email!: string;
  override name!: string;
  override accessToken?: string | null;
  override refreshToken?: string | null;
}
