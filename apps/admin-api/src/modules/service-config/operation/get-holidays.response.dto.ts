import { ApiProperty } from '@nestjs/swagger';
import { ListResponseDto } from '@pkg/server-core/http/dto/response/list.response.dto';
import { Type } from 'class-transformer';

import { OperatingHolidayItemDto } from '#/modules/service-config/operation/operating-holiday-item.dto';

export class GetHolidaysResponseDto extends ListResponseDto<OperatingHolidayItemDto> {
  @ApiProperty({ example: 2026 })
  year!: number;

  @ApiProperty({ example: 19 })
  count!: number;

  @ApiProperty({ type: [OperatingHolidayItemDto] })
  @Type(() => OperatingHolidayItemDto)
  override items!: OperatingHolidayItemDto[];
}
