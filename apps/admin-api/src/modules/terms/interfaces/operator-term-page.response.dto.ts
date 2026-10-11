import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response';

import { OperatorTermItemDto } from './operator-term-item.dto';

export class OperatorTermPageResponseDto extends PageResponseDto<OperatorTermItemDto> {
  @ApiProperty({ type: [OperatorTermItemDto] })
  @Type(() => OperatorTermItemDto)
  override items!: OperatorTermItemDto[];
}
