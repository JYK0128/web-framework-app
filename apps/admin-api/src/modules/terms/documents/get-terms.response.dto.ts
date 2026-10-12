import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { TermItemDto } from '#/modules/terms/documents/term-item.dto';

export class GetTermsResponseDto extends PageResponseDto<TermItemDto> {
  @ApiProperty({ type: [TermItemDto] })
  @Type(() => TermItemDto)
  override items!: TermItemDto[];
}
