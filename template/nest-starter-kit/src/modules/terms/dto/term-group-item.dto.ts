import { ApiProperty } from '@nestjs/swagger';
import { type ClassConstructor, plainToInstance } from 'class-transformer';

import { EntityDto } from '#/common/dto/entity-dto';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class TermGroupItemDto extends EntityDto(TermGroup) {
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

  static from<T extends TermGroupItemDto>(this: ClassConstructor<T>, group: TermGroup): T {
    return plainToInstance(this, {
      id: group.id,
      code: group.code,
      title: group.title,
      isRequired: group.isRequired,
      sortOrder: group.sortOrder,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
  }
}
