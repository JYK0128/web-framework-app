import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces/response';

import { OperatorTermItemDto } from './operator-term-item.dto';

export class GetOperatorTermsResponseDto extends PageResponseDto<OperatorTermItemDto> {
  @ApiProperty({ type: [OperatorTermItemDto] })
  @Type(() => OperatorTermItemDto)
  override items!: OperatorTermItemDto[];
}
