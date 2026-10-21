import { ApiProperty } from '@nestjs/swagger';
import { BaseDto } from '@pkg/server-core/http/dto/base';
import { NoticeImportance } from '@pkg/shared/constants';

export class NoticeItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ enum: NoticeImportance }) importance!: NoticeImportance;
  @ApiProperty({ type: Boolean }) isPinned!: boolean;
  @ApiProperty({ type: Boolean }) isDraft!: boolean;
  @ApiProperty({ type: Boolean }) isScheduled!: boolean;
  @ApiProperty({ type: Boolean }) isPublished!: boolean;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
