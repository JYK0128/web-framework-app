import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  iss?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  authuser?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prompt?: string;
}
