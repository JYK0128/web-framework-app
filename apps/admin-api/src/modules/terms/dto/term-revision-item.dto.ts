import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { Term } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

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
