import { ApiProperty, ApiPropertyOptional, ApiSchema, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';
import { Event } from '#/entities/events/event.entity';
import { PublicationStatus } from '#/entities/notices/notice.entity';

@ApiSchema({ name: 'CreateEventRequest' })
export class CreateEventRequestDto {
  @ApiProperty({ type: String, maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ type: String, format: 'date-time' }) @Type(() => Date) @IsDate() startsAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) @Type(() => Date) @IsDate() endsAt!: Date;
  @ApiPropertyOptional({ type: String, maxLength: 500 }) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) imageUrl?: string | null;
  @ApiPropertyOptional({ type: String, maxLength: 500 }) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) linkUrl?: string | null;
  @ApiProperty({ enum: PublicationStatus, default: PublicationStatus.draft }) @IsEnum(PublicationStatus) status = PublicationStatus.draft;
}

export class UpdateEventRequestDto extends PartialType(CreateEventRequestDto) {}

@ApiSchema({ name: 'EventItem' })
export class EventItemDto extends EntityDto(Event) {
  @ApiProperty({ type: String }) override id!: string;
  @ApiProperty({ type: String }) override title!: string;
  @ApiProperty({ type: String }) override content!: string;
  @ApiProperty({ type: String, format: 'date-time' }) override startsAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override endsAt!: Date;
  @ApiProperty({ type: String, nullable: true }) override imageUrl!: string | null;
  @ApiProperty({ type: String, nullable: true }) override linkUrl!: string | null;
  @ApiProperty({ enum: PublicationStatus }) override status!: PublicationStatus;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) override publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) override createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override updatedAt!: Date;
  static override from(event: Event): EventItemDto {
    return this.fromPlain({ id: event.id, title: event.title, content: event.content, startsAt: event.startsAt, endsAt: event.endsAt, imageUrl: event.imageUrl, linkUrl: event.linkUrl, status: event.status, publishedAt: event.publishedAt, createdAt: event.createdAt, updatedAt: event.updatedAt });
  }
}

export class GetEventsRequestDto extends PageRequestDto<Event, 'startsAt' | 'createdAt'> {
  @ApiPropertyOptional({ enum: PublicationStatus }) @IsOptional() @IsEnum(PublicationStatus) status?: PublicationStatus;
  override get searchFields(): (keyof Event)[] { return ['title', 'content']; }
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
  override toFilterQuery() {
    const query = super.toFilterQuery();
    return { $and: [query, ...(this.status ? [{ status: this.status }] : [])] };
  }
}

@ApiSchema({ name: 'EventPageResponse' })
export class EventPageResponseDto extends PageResponseDto<EventItemDto> {
  @ApiProperty({ type: [EventItemDto] }) @Type(() => EventItemDto) items!: EventItemDto[];
}

export class EventActionResponseDto { @ApiProperty({ type: Boolean }) ok!: boolean; }
