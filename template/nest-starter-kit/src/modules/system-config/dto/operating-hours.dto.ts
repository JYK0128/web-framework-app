import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

import { HolidayItemDto } from './holiday-item.dto';

export class LunchBreakDto {
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

export class MaintenanceWindowDto {
  @ApiProperty({ example: false, description: '점검 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({
    example: 2,
    description: '정기 점검 요일 (0: 일, 1: 월 ... 6: 토, null: 반복 없음)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  recurringDay!: number | null;

  @ApiProperty({ example: '02:00', description: '점검 시작 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @ApiProperty({ example: '06:00', description: '점검 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;

  @ApiProperty({
    example: '2026-03-01T00:00:00.000Z',
    description: '1회성 예약 점검 시작 일시 (ISO 8601)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  scheduledStartAt!: string | null;

  @ApiProperty({
    example: '2026-03-01T06:00:00.000Z',
    description: '1회성 예약 점검 종료 일시 (ISO 8601)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  scheduledEndAt!: string | null;
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

  @ApiProperty({ example: '현재 시스템 점검 중입니다.', description: '시스템 점검 안내 문구' })
  @IsString()
  maintenance!: string;
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
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  openDays!: number[];

  @ApiProperty({ type: LunchBreakDto, description: '점심/휴게시간 설정' })
  @ValidateNested()
  @Type(() => LunchBreakDto)
  lunchBreak!: LunchBreakDto;

  @ApiProperty({ type: MaintenanceWindowDto, description: '시스템 점검 시간 설정' })
  @ValidateNested()
  @Type(() => MaintenanceWindowDto)
  maintenance!: MaintenanceWindowDto;

  @ApiProperty({ type: [HolidayItemDto], description: '공휴일 및 특별 휴무일 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HolidayItemDto)
  holidays!: HolidayItemDto[];

  @ApiProperty({ type: OperatingMessagesDto, description: '상황별 안내 메시지 묶음' })
  @ValidateNested()
  @Type(() => OperatingMessagesDto)
  messages!: OperatingMessagesDto;
}
