import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { NOTICE_IMPORTANCE, PUBLICATION_STATUS } from '#/modules/notices/notices.constants';

export class NoticeItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ enum: NOTICE_IMPORTANCE }) importance!: typeof NOTICE_IMPORTANCE[number];
  @ApiProperty({ type: Boolean }) isPinned!: boolean;
  @ApiProperty({ enum: PUBLICATION_STATUS }) status!: typeof PUBLICATION_STATUS[number];
  @ApiProperty({ format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
