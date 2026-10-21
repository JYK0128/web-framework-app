import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { PushConfigDto } from '@pkg/server-core/notification/dto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

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
