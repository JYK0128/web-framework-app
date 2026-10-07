import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { Notice, NoticePriority, NoticeStatus } from '#/entities/notices/notice.entity';

export class NoticeItemDto extends EntityDto(Notice) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiEnum({ enum: NoticePriority, default: NoticePriority.LOW })
  override priority!: NoticePriority;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override expiresAt!: Date | null;

  @ApiEnum({ enum: NoticeStatus })
  override status!: NoticeStatus;

  @ApiProperty({ type: 'boolean' })
  override isPublished!: boolean;

  @ApiProperty({ type: 'boolean', required: false })
  isRead?: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
