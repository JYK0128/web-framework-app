import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsString, Matches, ValidateNested } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { SystemConfig } from '#/entities/system-config/system-config.entity';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';
import { OperatingLunchBreakDto } from './operating-hours.dto';

export class OperatingHoursUpdateDto {
  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  start!: string;

  @ApiProperty({ example: '18:00' })
  @IsString()
  @Matches(/^\d{2}:\d{2}$/)
  end!: string;

  @ApiProperty({ type: [Number], example: [1, 2, 3, 4, 5] })
  @IsArray()
  openDays!: number[];

  @ApiProperty({ type: OperatingLunchBreakDto })
  @ValidateNested()
  @Type(() => OperatingLunchBreakDto)
  lunchBreak!: OperatingLunchBreakDto;
}

export class UpdateOperationsTabRequestDto extends DtoType(SystemConfig) {
  @ApiProperty({ type: OperatingHoursUpdateDto, description: '운영시간 설정' })
  @ValidateNested()
  @Type(() => OperatingHoursUpdateDto)
  hours!: OperatingHoursUpdateDto;

  @ApiProperty({ type: [OperatingHolidayItemDto], description: '공휴일 및 특별 휴무일 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHolidayItemDto)
  holidays!: OperatingHolidayItemDto[];
}
