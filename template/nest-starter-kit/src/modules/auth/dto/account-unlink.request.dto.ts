import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountUnlinkRequestDto extends DtoType(Account) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override providerId!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;
}
