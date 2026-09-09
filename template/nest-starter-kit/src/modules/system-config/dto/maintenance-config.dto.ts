import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Matches, Max, Min, ValidateNested } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';

export class TemporaryMaintenanceDto {
  @ApiProperty({ example: false, description: '임시 점검 활성화 여부' })
  @IsBoolean()
  enabled!: boolean;

  @ApiProperty({ example: '현재 시스템 점검 중입니다. 점검 완료 후 정상 이용 가능합니다.', description: '임시 점검 안내 문구' })
  @IsString()
  message!: string;

  @ApiProperty({
    type: String,
    example: '2026-03-01T00:00:00.000Z',
    description: '임시 점검 시작 일시 (ISO 8601, 미지정 시 즉시 시작)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  startAt!: string | null;

  @ApiProperty({
    type: String,
    example: '2026-03-01T06:00:00.000Z',
    description: '임시 점검 종료 일시 (ISO 8601, 미지정 시 수동 해제 전까지 유지)',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  endAt!: string | null;
}

export class RecurringMaintenanceDto {
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
  @Matches(/^\d{2}:\d{2}$/)
  startTime!: string;

  @ApiProperty({ example: '04:00', description: '정기 점검 종료 시각 (HH:mm)' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  endTime!: string;
}

export class MaintenanceConfigDto {
  @ApiProperty({ type: TemporaryMaintenanceDto, description: '임시 점검 설정' })
  @ValidateNested()
  @Type(() => TemporaryMaintenanceDto)
  temporary!: TemporaryMaintenanceDto;

  @ApiProperty({ type: RecurringMaintenanceDto, description: '정기 점검 설정' })
  @ValidateNested()
  @Type(() => RecurringMaintenanceDto)
  recurring!: RecurringMaintenanceDto;
}
