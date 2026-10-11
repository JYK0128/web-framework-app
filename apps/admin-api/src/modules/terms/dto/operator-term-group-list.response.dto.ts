import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/core/http/dto/response/list.response.dto';
import { OperatorTermGroupItemDto } from '#/modules/terms/dto/operator-term-group-item.dto';

export class OperatorTermGroupListResponseDto extends ListResponseDto<OperatorTermGroupItemDto> {
  @ApiProperty({ type: [OperatorTermGroupItemDto] })
  @Type(() => OperatorTermGroupItemDto)
  override items!: OperatorTermGroupItemDto[];
}
