import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base';
import { NoticeImportance } from '@pkg/shared/constants';

import { Notice } from '~/core/database/entities/notices';

@ApiSchema({ name: 'NoticeItem' })
export class NoticeItemDto extends EntityDto(Notice) {
  @ApiProperty({ type: String }) override id!: string;
  @ApiProperty({ type: String }) override title!: string;
  @ApiProperty({ type: String }) override content!: string;
  @ApiProperty({ enum: NoticeImportance }) override importance!: NoticeImportance;
  @ApiProperty({ type: Boolean }) override isPinned!: boolean;
  @ApiProperty({ type: Boolean }) override isDraft!: boolean;
  @ApiProperty({ type: Boolean }) override isScheduled!: boolean;
  @ApiProperty({ type: Boolean }) override isPublished!: boolean;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) override publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) override createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override updatedAt!: Date;

  static override parseEntity(notice: Notice): NoticeItemDto {
    return this.parse({ id: notice.id, title: notice.title, content: notice.content, importance: notice.importance, isPinned: notice.isPinned, isDraft: notice.isDraft, isScheduled: notice.isScheduled, isPublished: notice.isPublished, publishedAt: notice.publishedAt, createdAt: notice.createdAt, updatedAt: notice.updatedAt });
  }
}
