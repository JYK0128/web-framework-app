import { Type } from 'class-transformer';
import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces/response';

import { OperatorItemDto } from './operator-item.dto';

@ApiSchema({ name: 'OperatorListResponse' })
export class GetOperatorsResponseDto extends PageResponseDto<OperatorItemDto> {
  @ApiProperty({ type: [OperatorItemDto] })
  @Type(() => OperatorItemDto) override items!: OperatorItemDto[];
}
