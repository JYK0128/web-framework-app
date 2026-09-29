import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces/response';

import { OperatorTermGroupItemDto } from './operator-term-group-item.dto';

export class GetOperatorTermGroupsResponseDto extends ListResponseDto<OperatorTermGroupItemDto> {
  @ApiProperty({ type: [OperatorTermGroupItemDto] })
  @Type(() => OperatorTermGroupItemDto)
  override items!: OperatorTermGroupItemDto[];
}
