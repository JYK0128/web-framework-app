import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PushConfigDto } from '@pkg/shared/server';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';

export class TestPushRequestDto extends BaseDto {
  @ApiProperty({ example: 'device-token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiPropertyOptional({ type: PushConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PushConfigDto)
  config?: PushConfigDto;
}
