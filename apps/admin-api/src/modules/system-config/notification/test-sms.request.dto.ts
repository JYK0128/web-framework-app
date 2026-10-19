import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base/base.dto';
import { SmsConfigDto } from '@pkg/server-core/notification/dto';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class TestSmsRequestDto extends BaseDto {
  @ApiProperty({ example: '01012345678' })
  @IsString()
  @IsNotEmpty()
  to!: string;

  @ApiPropertyOptional({ type: SmsConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SmsConfigDto)
  config?: SmsConfigDto;
}
