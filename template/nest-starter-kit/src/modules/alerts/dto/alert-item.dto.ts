import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { Alert, AlertType } from '#/entities/alerts/alert.entity';

export class AlertItemDto extends EntityDto(Alert) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiEnum({ enum: AlertType })
  override type!: AlertType;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiProperty({ type: 'string', nullable: true })
  override linkUrl!: string | null;

  @ApiProperty({ type: 'boolean' })
  override isRead!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override readAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;
}
