import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';
import { TermRevisionItemDto } from '#/modules/terms/revisions/term-revision-item.dto';

export class GetTermRevisionsResponseDto extends PageResponseDto<TermRevisionItemDto> {
  @ApiProperty({ type: [TermRevisionItemDto] }) @Type(() => TermRevisionItemDto) override items!: TermRevisionItemDto[];
}
