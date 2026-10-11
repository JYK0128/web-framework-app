import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { EVENT_PUBLICATION_STATUS } from '#/modules/events/dto/events.constants';

export class CreateEventRequestDto extends BaseDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ format: 'date-time' }) @Type(() => Date) @IsDate() startsAt!: Date;
  @ApiProperty({ format: 'date-time' }) @Type(() => Date) @IsDate() endsAt!: Date;
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) imageUrl?: string | null;
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional() @IsUrl({ require_tld: false }) @MaxLength(500) linkUrl?: string | null;
  @ApiProperty({ enum: EVENT_PUBLICATION_STATUS }) @IsIn(EVENT_PUBLICATION_STATUS) status: typeof EVENT_PUBLICATION_STATUS[number] = 'draft';
}
