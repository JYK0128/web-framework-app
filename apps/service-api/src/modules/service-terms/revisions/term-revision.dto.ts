import { ApiProperty, ApiSchema, PickType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { Term } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';
import { PageRequestDto } from '#/core/http/dto/request/page.request.dto';
import { PageResponseDto } from '#/core/http/dto/response/page.response.dto';

export class GetTermRevisionsRequestDto extends PickType(PageRequestDto, ['page', 'limit'] as const) {}

@ApiSchema({ name: 'TermRevisionItem' })
export class TermRevisionItemDto extends EntityDto(Term) {
  @ApiProperty() id!: string;
  @ApiProperty() version!: string;
  @ApiProperty({ format: 'date-time' }) publishedAt!: Date;
  @ApiProperty() reason!: string;
  @ApiProperty() summary!: string;
  @ApiProperty() content!: string;

  static override parseEntity(term: Term): TermRevisionItemDto {
    return this.parse({ id: term.id, version: term.version, publishedAt: term.publishedAt, reason: term.reason, summary: term.summary, content: term.content });
  }
}

export class TermRevisionPageResponseDto extends PageResponseDto<TermRevisionItemDto> {
  @ApiProperty({ type: [TermRevisionItemDto] }) @Type(() => TermRevisionItemDto) override items!: TermRevisionItemDto[];
}
