import { ApiProperty } from '@nestjs/swagger';

import type { TermGroup } from '#/entities/terms/term-group.entity';

export class TermGroupItemDto {
  constructor(group: TermGroup) {
    this.id = group.id;
    this.code = group.code;
    this.title = group.title;
    this.isRequired = group.isRequired;
    this.sortOrder = group.sortOrder;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }

  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  isRequired!: boolean;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  updatedAt!: Date;
}
