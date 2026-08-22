import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account, AUTH_PROVIDERS, type AuthProvider } from '#/entities/auth/account.entity';

export class AccountUnlinkRequestDto extends DtoType(Account) {
  @ApiProperty({ enum: AUTH_PROVIDERS })
  @IsEnum(AUTH_PROVIDERS)
  @IsNotEmpty()
  override providerId!: AuthProvider;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;
}
