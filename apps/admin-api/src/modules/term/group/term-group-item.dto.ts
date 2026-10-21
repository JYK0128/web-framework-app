import { ApiProperty } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';

import { TermGroup } from '~/core/database/entities/terms';

export class TermGroupItemDto extends EntityDto(TermGroup) {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static override parseEntity(group: TermGroup): TermGroupItemDto {
    return this.parse({
      id: group.id,
      title: group.title,
      isRequired: group.isRequired,
      sortOrder: group.sortOrder,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
  }
}
