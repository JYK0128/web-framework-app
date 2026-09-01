import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { OAUTH_PROVIDERS, OAuthProvider, type OAuthProvider as OAuthProviderType } from '#/common/constants/auth.constants';
import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Account } from '#/entities/auth/account.entity';

export class AccountLinkRequestDto extends DtoType(Account) {
  @ApiEnum({ enum: OAuthProvider })
  @IsEnum(OAUTH_PROVIDERS)
  @IsNotEmpty()
  override providerId!: OAuthProviderType;

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
