import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

import { AUTH_PROVIDERS, AuthProvider, type AuthProvider as AuthProviderType } from '#/common/configs/auth.config';
import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountUnlinkRequestDto extends DtoType(Account) {
  @ApiEnum({ enum: AuthProvider })
  @IsEnum(AUTH_PROVIDERS)
  @IsNotEmpty()
  override providerId!: AuthProviderType;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;
}
