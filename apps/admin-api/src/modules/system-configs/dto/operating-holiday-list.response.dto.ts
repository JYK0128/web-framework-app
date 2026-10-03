import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';

export class OperatingHolidayListResponseDto extends ListResponseDto<OperatingHolidayItemDto> {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 19 })
  count!: number;

  @ApiProperty({ type: [OperatingHolidayItemDto] })
  @Type(() => OperatingHolidayItemDto) override items!: OperatingHolidayItemDto[];
}
