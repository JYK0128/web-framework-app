import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginOAuthRequestDto {
  @ApiProperty({ description: 'Authorization code returned by Google.' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ description: 'One-time OAuth state returned by Google.' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiPropertyOptional({ description: 'Authorization server issuer returned by Google.' })
  @IsOptional()
  @IsString()
  iss?: string;

  @ApiPropertyOptional({ description: 'Granted scopes returned by Google.' })
  @IsOptional()
  @IsString()
  scope?: string;

  @ApiPropertyOptional({ description: 'Selected Google account index.' })
  @IsOptional()
  @IsString()
  authuser?: string;

  @ApiPropertyOptional({ description: 'Consent prompt result returned by Google.' })
  @IsOptional()
  @IsString()
  prompt?: string;
}
