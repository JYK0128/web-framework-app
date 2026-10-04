import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmailConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, ValidateNested } from 'class-validator';

import { OkResponseDto } from '#/common/interfaces/response';

export class TestEmailRequestDto {
  @ApiProperty({ example: 'operator@example.com' })
  @IsEmail()
  to!: string;

  @ApiPropertyOptional({ type: EmailConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmailConfigDto)
  config?: EmailConfigDto;
}

export class TestEmailResponseDto extends OkResponseDto {}
