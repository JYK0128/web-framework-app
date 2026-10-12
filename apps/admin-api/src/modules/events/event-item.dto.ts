import { ApiProperty } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { EVENT_PUBLICATION_STATUS } from '#/modules/events/events.constants';

export class EventItemDto extends BaseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() content!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: Date;
  @ApiProperty({ format: 'date-time' }) endsAt!: Date;
  @ApiProperty({ nullable: true }) imageUrl!: string | null;
  @ApiProperty({ nullable: true }) linkUrl!: string | null;
  @ApiProperty({ enum: EVENT_PUBLICATION_STATUS }) status!: typeof EVENT_PUBLICATION_STATUS[number];
  @ApiProperty({ format: 'date-time', nullable: true }) publishedAt!: Date | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: Date;
  @ApiProperty({ format: 'date-time' }) updatedAt!: Date;
}
