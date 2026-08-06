import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountUnlinkRequestDto extends DtoType(Account, [
  'providerId',
  'accountId',
] as const) {
  @ApiProperty({ example: 'google' })
  @IsString()
  @IsNotEmpty()
  override providerId!: string;

  @ApiProperty({ example: '104938291048' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;
}
