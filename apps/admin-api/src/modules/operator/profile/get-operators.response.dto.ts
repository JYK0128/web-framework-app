import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response';
import { Type } from 'class-transformer';

import { OperatorItemDto } from '~/modules/operator/profile/operator-item.dto';

export class GetOperatorsResponseDto extends PageResponseDto<OperatorItemDto> {
  @ApiProperty({ type: [OperatorItemDto] })
  @Type(() => OperatorItemDto)
  override items!: OperatorItemDto[];
}
