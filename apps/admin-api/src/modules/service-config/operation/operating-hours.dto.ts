import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

import { ToNumber } from '#/core/http/decorators/to-number.decorator';
import { BaseDto } from '#/core/http/dto/base/base.dto';
import { OperatingLunchBreakDto } from '#/modules/service-config/operation/operating-lunch-break.dto';

export class OperatingHoursDto extends BaseDto {
  @ApiProperty({ example: '09:00', description: '운영 시작 시각 (HH:mm)' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  start!: string;

  @ApiProperty({ example: '18:00', description: '운영 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^(?:(?:[01]\d|2[0-3]):[0-5]\d|24:00)$/)
  end!: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], type: [Number], description: '운영 요일 (0: 일, 1: 월 ... 6: 토)' })
  @IsArray()
  @ToNumber()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  openDays!: number[];

  @ApiProperty({ type: OperatingLunchBreakDto, description: '점심/휴게시간 설정' })
  @ValidateNested()
  @Type(() => OperatingLunchBreakDto)
  lunchBreak!: OperatingLunchBreakDto;
}
