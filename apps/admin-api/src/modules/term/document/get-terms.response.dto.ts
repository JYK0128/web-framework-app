import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { TermItemDto } from '#/modules/term/document/term-item.dto';

export class GetTermsResponseDto extends PageResponseDto<TermItemDto> {
  @ApiProperty({ type: [TermItemDto] })
  @Type(() => TermItemDto)
  override items!: TermItemDto[];
}
