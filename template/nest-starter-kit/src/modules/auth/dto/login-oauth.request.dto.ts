import { EntityType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { User } from '#/entities/auth/user.entity';

export class LoginOAuthRequestDto extends EntityType(User, Account) {
  provider!: string;
  override accountId!: string;
  override email!: string;
  override name!: string;
  override accessToken?: string;
  override refreshToken?: string;
}
