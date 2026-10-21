import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { IsBoolean, IsString, Matches } from 'class-validator';

export class OperatingLunchBreakDto extends BaseDto {
  @ApiProperty({ example: false, description: '점심시간 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: '12:00', description: '점심시간 시작 시각 (HH:mm)' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  start!: string;

  @ApiProperty({ example: '13:00', description: '점심시간 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  end!: string;
}
