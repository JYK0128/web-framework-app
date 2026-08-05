import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { EntityType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountLinkRequestDto extends EntityType(Account) {
  @ApiProperty({ example: 'google' })
  @IsString()
  @IsNotEmpty()
  override providerId!: string;

  @ApiProperty({ example: '104938291048' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  override accessToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  override refreshToken?: string;
}
