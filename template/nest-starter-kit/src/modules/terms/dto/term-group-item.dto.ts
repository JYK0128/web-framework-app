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

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override code!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'boolean' })
  override isRequired!: boolean;

  @ApiProperty({ type: 'number' })
  override sortOrder!: number;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
