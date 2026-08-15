import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Notice, NOTICE_PRIORITIES, type NoticePriority } from '#/entities/notices/notice.entity';

export class NoticeFeedItemDto extends DtoType(Notice) {
  constructor(notice: Notice, isRead: boolean) {
    super();
    this.id = notice.id;
    this.title = notice.title;
    this.content = notice.content;
    this.isPinned = notice.isPinned;
    this.priority = notice.priority;
    this.publishedAt = notice.publishedAt ?? null;
    this.expiresAt = notice.expiresAt ?? null;
    this.isPublished = notice.isPublished;
    this.createdAt = notice.createdAt;
    this.updatedAt = notice.updatedAt;
    this.isRead = isRead;
  }

  @ApiProperty()
  override id!: string;

  @ApiProperty()
  override title!: string;

  @ApiProperty()
  override content!: string;

  @ApiProperty()
  override isPinned!: boolean;

  @ApiProperty({ enum: NOTICE_PRIORITIES, default: 0 })
  override priority!: NoticePriority;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override publishedAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  override expiresAt!: Date | null;

  @ApiProperty()
  override isPublished!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  @ApiProperty()
  isRead!: boolean;
}
