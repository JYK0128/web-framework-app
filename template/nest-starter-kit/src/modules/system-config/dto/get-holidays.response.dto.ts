import { ApiProperty } from '@nestjs/swagger';

import { OperatingHolidayItemDto } from './operating-holiday-item.dto';

export class GetHolidaysResponseDto {
  @ApiProperty({ example: 2026, description: '조회 연도' })
  year!: number;

  @ApiProperty({ example: 19, description: '공식 법정공휴일 총 개수' })
  count!: number;

  @ApiProperty({ type: [OperatingHolidayItemDto], description: '공식 법정공휴일 목록' })
  holidays!: OperatingHolidayItemDto[];
}
