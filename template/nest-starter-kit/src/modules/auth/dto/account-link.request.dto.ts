import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OAUTH_PROVIDERS, type OAuthProvider } from '@pkg/shared/common';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountLinkRequestDto extends DtoType(Account) {
  @ApiProperty({ enum: OAUTH_PROVIDERS })
  @IsEnum(OAUTH_PROVIDERS)
  @IsNotEmpty()
  override providerId!: OAuthProvider;

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
