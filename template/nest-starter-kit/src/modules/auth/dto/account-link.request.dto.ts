import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountLinkRequestDto extends DtoType(Account) {
  @ApiProperty({ type: 'string', description: 'DB에 등록된 OAuth provider 식별자' })
  @IsString()
  @IsNotEmpty()
  override providerId!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  override accountId!: string;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  override accessToken?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  override refreshToken?: string | null;
}
