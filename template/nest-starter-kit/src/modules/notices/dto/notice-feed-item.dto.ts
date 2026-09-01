import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Notice, NoticePriority } from '#/entities/notices/notice.entity';

export class NoticeFeedItemDto extends DtoType(Notice) {
  constructor(notice: Notice, isRead: boolean) {
    super();
    this.id = notice.id;
    this.title = notice.title;
    this.content = notice.content;
    this.priority = notice.priority;
    this.publishedAt = notice.publishedAt ?? null;
    this.expiresAt = notice.expiresAt ?? null;
    this.isPublished = notice.isPublished;
    this.createdAt = notice.createdAt;
    this.updatedAt = notice.updatedAt;
    this.isRead = isRead;
  }

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

  @ApiProperty({ type: 'boolean' })
  override isPublished!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;

  @ApiProperty({ type: 'boolean' })
  isRead!: boolean;
}
