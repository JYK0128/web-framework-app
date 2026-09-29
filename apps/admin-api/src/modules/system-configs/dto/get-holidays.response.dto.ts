import { ApiProperty } from '@nestjs/swagger';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';

export class GetHolidaysResponseDto {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 19 })
  count!: number;

  @ApiProperty({ type: [OperatingHolidayItemDto] })
  holidays!: OperatingHolidayItemDto[];
}
