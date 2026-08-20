import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginOAuthRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  state!: string;

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
