import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';
import { OperatingHoursDto, OperatingMessagesDto } from './operating-hours.dto';

export class OperationConfigDto {
  @ApiProperty({ type: OperatingHoursDto, description: '운영 시간 설정' })
  @ValidateNested()
  @Type(() => OperatingHoursDto)
  hours!: OperatingHoursDto;

  @ApiProperty({ type: [OperatingHolidayItemDto], description: '공휴일 및 특별 휴무일 목록' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OperatingHolidayItemDto)
  holidays!: OperatingHolidayItemDto[];

  @ApiProperty({ type: OperatingMessagesDto, description: '운영 상태별 안내 메시지' })
  @ValidateNested()
  @Type(() => OperatingMessagesDto)
  messages!: OperatingMessagesDto;
}
