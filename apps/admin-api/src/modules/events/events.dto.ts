import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';
import type { BaseEntity } from '#/entities/common/base.entity';

export const EVENT_PUBLICATION_STATUS = ['draft', 'published'] as const;
export class CreateEventRequestDto {
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ format: 'date-time' }) @Type(() => Date) @IsDate() startsAt!: Date;
  @ApiProperty({ format: 'date-time' }) @Type(() => Date) @IsDate() endsAt!: Date;
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) imageUrl?: string | null;
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) linkUrl?: string | null;
  @ApiProperty({ enum: EVENT_PUBLICATION_STATUS }) @IsIn(EVENT_PUBLICATION_STATUS) status: typeof EVENT_PUBLICATION_STATUS[number] = 'draft';
}
export class UpdateEventRequestDto extends PartialType(CreateEventRequestDto) {}
export class EventItemDto {
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
export class GetEventsRequestDto extends PageRequestDto<BaseEntity, 'startsAt' | 'createdAt'> {
  @ApiPropertyOptional({ enum: EVENT_PUBLICATION_STATUS }) @IsOptional() @IsIn(EVENT_PUBLICATION_STATUS) status?: typeof EVENT_PUBLICATION_STATUS[number];
  override sort: ('startsAt' | 'createdAt')[] = ['startsAt'];
}
export class EventPageResponseDto extends PageResponseDto<EventItemDto> { @ApiProperty({ type: [EventItemDto] }) @Type(() => EventItemDto) items!: EventItemDto[]; }
export class EventActionResponseDto { @ApiProperty() ok!: boolean; }
