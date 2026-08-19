import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Alert, AlertType } from '#/entities/alerts/alert.entity';

export class AlertItemDto extends DtoType(Alert) {
  constructor(alert: Alert) {
    super();
    this.id = alert.id;
    this.type = alert.type;
    this.title = alert.title;
    this.content = alert.content;
    this.linkUrl = alert.linkUrl ?? null;
    this.isRead = alert.isRead;
    this.readAt = alert.readAt ?? null;
    this.createdAt = alert.createdAt;
  }

  @ApiProperty()
  override id!: string;

  @ApiEnum({ enum: AlertType })
  override type!: AlertType;

  @ApiProperty()
  override title!: string;

  @ApiProperty()
  override content!: string;

  @ApiProperty({ nullable: true })
  override linkUrl!: string | null;

  @ApiProperty()
  override isRead!: boolean;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override readAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;
}
