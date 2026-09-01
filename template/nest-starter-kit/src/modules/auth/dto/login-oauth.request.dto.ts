import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LoginOAuthRequestDto {
  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  error_description?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  iss?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  authuser?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  prompt?: string;
}
