import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { TermItemDto } from './term-item.dto';

export class GetTermsResponseDto extends ListResponseDto<TermItemDto> {
  @ApiProperty({ type: [TermItemDto] })
  @Type(() => TermItemDto)
  override items!: TermItemDto[];
}
