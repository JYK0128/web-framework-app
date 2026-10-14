import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base/entity.dto';

import { Term } from '#/core/database/entities/terms';

@ApiSchema({ name: 'ServiceTermItem' })
export class ServiceTermItemDto extends EntityDto(Term) {
  @ApiProperty() id!: string;
  @ApiProperty() groupId!: string;
  @ApiProperty() title!: string;
  @ApiProperty() version!: string;
  @ApiProperty() content!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) publishedAt!: Date;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;

  static override parseEntity(term: Term): ServiceTermItemDto {
    return this.parse({
      id: term.id,
      groupId: term.termGroup.id,
      title: term.termGroup.title,
      version: term.version,
      content: term.content,
      isRequired: term.termGroup.isRequired,
      sortOrder: term.termGroup.sortOrder,
      publishedAt: term.publishedAt,
      createdAt: term.createdAt,
      updatedAt: term.updatedAt,
    });
  }
}
