import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';
import type { BaseEntity } from '#/entities/common/base.entity';

export const NOTICE_IMPORTANCE = ['normal', 'important', 'urgent'] as const;
export const PUBLICATION_STATUS = ['draft', 'published'] as const;
export class CreateNoticeRequestDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty() @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ enum: NOTICE_IMPORTANCE }) @IsIn(NOTICE_IMPORTANCE) importance: typeof NOTICE_IMPORTANCE[number] = 'normal';
  @ApiProperty({ type: Boolean, default: false }) @IsBoolean() isPinned = false;
  @ApiProperty({ enum: PUBLICATION_STATUS }) @IsIn(PUBLICATION_STATUS) status: typeof PUBLICATION_STATUS[number] = 'draft';
}
export class UpdateNoticeRequestDto extends PartialType(CreateNoticeRequestDto) {
  static readonly richTextFields = ['content'];
}
export class NoticeItemDto {
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
export class GetNoticesRequestDto extends PageRequestDto<BaseEntity, 'createdAt' | 'publishedAt'> {
  @ApiPropertyOptional({ enum: PUBLICATION_STATUS }) @IsOptional() @IsIn(PUBLICATION_STATUS) status?: typeof PUBLICATION_STATUS[number];
  @ApiPropertyOptional({ enum: NOTICE_IMPORTANCE }) @IsOptional() @IsIn(NOTICE_IMPORTANCE) importance?: typeof NOTICE_IMPORTANCE[number];
  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
}
export class NoticePageResponseDto extends PageResponseDto<NoticeItemDto> { @ApiProperty({ type: [NoticeItemDto] }) @Type(() => NoticeItemDto) items!: NoticeItemDto[]; }
export class NoticeActionResponseDto { @ApiProperty() ok!: boolean; }
