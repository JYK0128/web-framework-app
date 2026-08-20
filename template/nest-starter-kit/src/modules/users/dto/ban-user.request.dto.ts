import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class BanUserRequestDto {
  @ApiPropertyOptional({ type: 'string', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;
}
