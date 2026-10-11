import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class TestEmailRequestDto extends BaseDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;

  @ApiPropertyOptional({ type: EmailConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  config?: EmailConfigDto;
}
