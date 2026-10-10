import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/dto/response';

import { OperatorTermGroupItemDto } from './operator-term-group-item.dto';

export class OperatorTermGroupListResponseDto extends ListResponseDto<OperatorTermGroupItemDto> {
  @ApiProperty({ type: [OperatorTermGroupItemDto] })
  @Type(() => OperatorTermGroupItemDto)
  override items!: OperatorTermGroupItemDto[];
}
