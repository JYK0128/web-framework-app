import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginOAuthRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  state!: string;

  /** Optional parameters returned by Google's OAuth/OIDC authorization endpoint. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  iss?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  authuser?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  prompt?: string;
}
