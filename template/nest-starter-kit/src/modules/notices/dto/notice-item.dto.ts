import { ApiProperty } from '@nestjs/swagger';

import type { Notice } from '#/entities/notices/notice.entity';

export class NoticeItemDto {
  constructor(notice: Notice) {
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
  }

  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  isPinned!: boolean;

  @ApiProperty({ enum: [0, 1, 2], default: 0 })
  priority!: number;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  @ApiProperty({ type: Date, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty()
  isPublished!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  updatedAt!: Date;
}
