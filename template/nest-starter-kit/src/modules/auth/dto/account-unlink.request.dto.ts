import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountUnlinkRequestDto extends EntityDto(Account) {
  @ApiProperty({ type: 'string', description: 'credential 또는 DB에 등록된 OAuth provider 식별자' })
  @IsString()
  @IsNotEmpty()
  override providerId!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;
}
