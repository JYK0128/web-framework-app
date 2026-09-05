import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';

export class OperatingLunchBreakDto {
  @ApiProperty({ example: false, description: '점심시간 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: '12:00', description: '점심시간 시작 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @ApiProperty({ example: '13:00', description: '점심시간 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;
}

export class OperatingMessagesDto {
  @ApiProperty({ example: '현재 점심시간입니다.', description: '점심시간 안내 문구' })
  @IsString()
  lunch!: string;

  @ApiProperty({ example: '현재는 운영시간 외입니다.', description: '운영시간 외 안내 문구' })
  @IsString()
  offHours!: string;

  @ApiProperty({ example: '주말 및 공휴일은 고객센터 휴무입니다.', description: '휴일 안내 문구' })
  @IsString()
  holiday!: string;
}

export class OperatingHoursDto {
  @ApiProperty({ example: '09:00', description: '운영 시작 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @ApiProperty({ example: '18:00', description: '운영 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
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

  @ApiProperty({ type: [OperatingHolidayItemDto], description: '공휴일 및 특별 휴무일 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHolidayItemDto)
  holidays!: OperatingHolidayItemDto[];

  @ApiProperty({ type: OperatingMessagesDto, description: '상황별 안내 메시지 묶음' })
  @ValidateNested()
  @Type(() => OperatingMessagesDto)
  messages!: OperatingMessagesDto;
}
