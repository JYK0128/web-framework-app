import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces/response/list.response.dto';

import { InternalServiceTermGroupItemDto } from './internal-service-term-group-item.dto';

export class InternalServiceTermGroupListResponseDto extends ListResponseDto<InternalServiceTermGroupItemDto> {
  @ApiProperty({ type: [InternalServiceTermGroupItemDto] })
  override items!: InternalServiceTermGroupItemDto[];
}
