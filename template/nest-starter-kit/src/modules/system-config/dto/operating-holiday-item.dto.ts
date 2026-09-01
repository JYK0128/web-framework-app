import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { defineEnum } from '#/common/dto/enum';

export const HolidayType = defineEnum('HolidayType', {
  STATUTORY: 'STATUTORY',
  CUSTOM: 'CUSTOM',
} as const);

export type HolidayType = (typeof HolidayType)[keyof typeof HolidayType];

export class OperatingHolidayItemDto {
  @ApiProperty({ example: '2026-03-01', description: '공휴일 날짜 (YYYY-MM-DD)' })
  date!: string;

  @ApiProperty({ example: '3·1절', description: '공휴일/휴무 명칭' })
  name!: string;

  @ApiEnum({
    enum: HolidayType,
    example: HolidayType.STATUTORY,
    description: '공휴일 구분 (STATUTORY: 법정공휴일, CUSTOM: 특별지정휴일)',
  })
  type!: HolidayType;
}
