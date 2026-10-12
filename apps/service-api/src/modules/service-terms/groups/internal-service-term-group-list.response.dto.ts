import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';

import { InternalServiceTermGroupItemDto } from './internal-service-term-group-item.dto';

export class InternalServiceTermGroupListResponseDto extends ListResponseDto<InternalServiceTermGroupItemDto> {
  @ApiProperty({ type: [InternalServiceTermGroupItemDto] })
  @Type(() => InternalServiceTermGroupItemDto) override items!: InternalServiceTermGroupItemDto[];
}
