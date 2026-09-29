import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response';

import { OperatorItemDto } from './operator-item.dto';

@ApiSchema({ name: 'OperatorListResponse' })
export class GetOperatorsResponseDto extends PageResponseDto<OperatorItemDto> {
  @ApiProperty({ type: [OperatorItemDto] })
  override items!: OperatorItemDto[];
}
