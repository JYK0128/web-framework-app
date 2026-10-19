import { ApiProperty } from '@nestjs/swagger';
import { PageResponseDto } from '@pkg/server-core/http/dto/response/page.response.dto';
import { Type } from 'class-transformer';

import { TermRevisionItemDto } from '#/modules/service-term/revision/term-revision-item.dto';

export class GetTermRevisionsResponseDto extends PageResponseDto<TermRevisionItemDto> {
  @ApiProperty({ type: [TermRevisionItemDto] })
  @Type(() => TermRevisionItemDto)
  override items!: TermRevisionItemDto[];
}
