import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class TermGroupItemDto extends DtoType(TermGroup) {
  constructor(group: TermGroup) {
    super();
    this.id = group.id;
    this.code = group.code;
    this.title = group.title;
    this.isRequired = group.isRequired;
    this.sortOrder = group.sortOrder;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }

  @ApiProperty()
  override id!: string;

  @ApiProperty()
  override code!: string;

  @ApiProperty()
  override title!: string;

  @ApiProperty()
  override isRequired!: boolean;

  @ApiProperty()
  override sortOrder!: number;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
