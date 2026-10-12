import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsString, Matches, Max, Min } from 'class-validator';

import { ToNumber } from '#/core/http/decorators/to-number.decorator';
import { BaseDto } from '#/core/http/dto/base/base.dto';

export class RecurringMaintenanceDto extends BaseDto {
  @ApiProperty({ example: false, description: '정기 점검 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: '정기 시스템 점검 시간입니다. 점검 시간 동안 서비스 이용이 일시 중단됩니다.', description: '정기 점검 안내 문구' })
  @IsString()
  message!: string;

  @ApiProperty({ example: [4], type: [Number], description: '정기 점검 반복 요일 (0: 일, 1: 월 ... 6: 토)' })
  @IsArray()
  @ToNumber()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  daysOfWeek!: number[];

  @ApiProperty({ example: '02:00', description: '정기 점검 시작 시각 (HH:mm)' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  startTime!: string;

  @ApiProperty({ example: '04:00', description: '정기 점검 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  endTime!: string;
}
