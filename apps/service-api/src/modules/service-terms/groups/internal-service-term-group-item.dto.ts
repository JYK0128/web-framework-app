import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { TermGroup } from '#/core/database/entities/terms';
import { EntityDto } from '#/core/http/dto/base/entity.dto';

@ApiSchema({ name: 'InternalServiceTermGroupItem' })
export class InternalServiceTermGroupItemDto extends EntityDto(TermGroup) {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;

  static override parseEntity(group: TermGroup): InternalServiceTermGroupItemDto {
    return this.parse({ id: group.id, title: group.title, isRequired: group.isRequired, sortOrder: group.sortOrder, createdAt: group.createdAt, updatedAt: group.updatedAt });
  }
}
