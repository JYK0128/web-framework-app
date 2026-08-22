import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';
import { OAUTH_PROVIDERS, type OAuthProvider } from '#/infra/oauth/oauth.interface';

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
