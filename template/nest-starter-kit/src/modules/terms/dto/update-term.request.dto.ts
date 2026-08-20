import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTermRequestDto {
  @ApiPropertyOptional({ type: 'string', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ type: 'string', format: 'date-time', nullable: true })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;
}
