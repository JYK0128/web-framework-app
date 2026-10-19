import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { EntityDto } from '@pkg/server-core/http/dto/base/entity.dto';

import { Event, EventPhase } from '#/core/database/entities/events';

@ApiSchema({ name: 'EventItem' })
export class EventItemDto extends EntityDto(Event) {
  @ApiProperty({ type: String }) override id!: string;
  @ApiProperty({ type: String }) override title!: string;
  @ApiProperty({ type: String }) override content!: string;
  @ApiProperty({ type: String, format: 'date-time' }) override startsAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override endsAt!: Date;
  @ApiProperty({ type: String, nullable: true }) override imageUrl!: string | null;
  @ApiProperty({ type: String, nullable: true }) override linkUrl!: string | null;

  @ApiProperty({ type: Boolean }) override isDraft!: boolean;
  @ApiProperty({ type: Boolean }) override isScheduled!: boolean;
  @ApiProperty({ type: Boolean }) override isPublished!: boolean;
  @ApiProperty({ enum: EventPhase }) override phase!: EventPhase;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) override publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) override createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override updatedAt!: Date;
  static override parseEntity(event: Event): EventItemDto {
    return this.parse({ id: event.id, title: event.title, content: event.content, startsAt: event.startsAt, endsAt: event.endsAt, imageUrl: event.imageUrl, linkUrl: event.linkUrl, isDraft: event.isDraft, isScheduled: event.isScheduled, isPublished: event.isPublished, phase: event.phase, publishedAt: event.publishedAt, createdAt: event.createdAt, updatedAt: event.updatedAt });
  }
}
