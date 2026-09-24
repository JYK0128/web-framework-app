import { ApiProperty } from '@nestjs/swagger';

import { EntityResponseDto } from '#/common/interfaces/base';
import { TermGroup } from '#/entities/terms/term-group.entity';

export class OperatorTermGroupItemDto extends EntityResponseDto(TermGroup) {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() isRequired!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static override from(group: TermGroup): OperatorTermGroupItemDto {
    return OperatorTermGroupItemDto.fromPlain({
      id: group.id,
      title: group.title,
      isRequired: group.isRequired,
      sortOrder: group.sortOrder,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    });
  }
}
