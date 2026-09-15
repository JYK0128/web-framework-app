import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class TwoFactorCreateChallengeRequestDto {
  @ApiProperty({ type: 'string' })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({ type: 'boolean' })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
