import { ApiProperty, ApiPropertyOptional, ApiSchema, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { CursorRequestDto } from '#/common/interfaces/request/cursor.request.dto';
import { PageRequestDto } from '#/common/interfaces/request/page.request.dto';
import { CursorResponseDto } from '#/common/interfaces/response/cursor.response.dto';
import { PageResponseDto } from '#/common/interfaces/response/page.response.dto';
import { Notice, NoticeImportance, PublicationStatus } from '#/entities/notices/notice.entity';

@ApiSchema({ name: 'CreateNoticeRequest' })
export class CreateNoticeRequestDto {
  static readonly richTextFields = ['content'];
  @ApiProperty({ type: String, maxLength: 255 }) @IsString() @IsNotEmpty() @MaxLength(255) title!: string;
  @ApiProperty({ type: String }) @IsString() @IsNotEmpty() content!: string;
  @ApiProperty({ enum: NoticeImportance, default: NoticeImportance.normal }) @IsEnum(NoticeImportance) importance = NoticeImportance.normal;
  @ApiProperty({ type: Boolean, default: false }) @IsBoolean() isPinned = false;
  @ApiProperty({ enum: PublicationStatus, default: PublicationStatus.draft }) @IsEnum(PublicationStatus) status = PublicationStatus.draft;
}

export class UpdateNoticeRequestDto extends PartialType(CreateNoticeRequestDto) {
  static readonly richTextFields = ['content'];
}

@ApiSchema({ name: 'NoticeItem' })
export class NoticeItemDto extends EntityDto(Notice) {
  @ApiProperty({ type: String }) override id!: string;
  @ApiProperty({ type: String }) override title!: string;
  @ApiProperty({ type: String }) override content!: string;
  @ApiProperty({ enum: NoticeImportance }) override importance!: NoticeImportance;
  @ApiProperty({ type: Boolean }) override isPinned!: boolean;
  @ApiProperty({ enum: PublicationStatus }) override status!: PublicationStatus;
  @ApiProperty({ type: String, format: 'date-time', nullable: true }) override publishedAt!: Date | null;
  @ApiProperty({ type: String, format: 'date-time' }) override createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override updatedAt!: Date;

  static override from(notice: Notice): NoticeItemDto {
    return this.fromPlain({ id: notice.id, title: notice.title, content: notice.content, importance: notice.importance, isPinned: notice.isPinned, status: notice.status, publishedAt: notice.publishedAt, createdAt: notice.createdAt, updatedAt: notice.updatedAt });
  }
}

export class GetNoticesRequestDto extends PageRequestDto<Notice, 'createdAt' | 'publishedAt'> {
  @ApiPropertyOptional({ enum: PublicationStatus }) @IsOptional() @IsEnum(PublicationStatus) status?: PublicationStatus;
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
  override get searchFields(): (keyof Notice)[] { return ['title', 'content']; }
  override sort: ('createdAt' | 'publishedAt')[] = ['createdAt'];
  override toFilterQuery() {
    const query = super.toFilterQuery();
    const filters = [query, ...(this.status ? [{ status: this.status }] : []), ...(this.importance ? [{ importance: this.importance }] : [])];
    return { $and: filters };
  }
}

@ApiSchema({ name: 'NoticePageResponse' })
export class NoticePageResponseDto extends PageResponseDto<NoticeItemDto> {
  @ApiProperty({ type: [NoticeItemDto] }) @Type(() => NoticeItemDto) items!: NoticeItemDto[];
}

export class NoticeActionResponseDto {
  @ApiProperty({ type: Boolean }) ok!: boolean;
}

export class GetPublicNoticesRequestDto extends CursorRequestDto<Notice> {
  @ApiPropertyOptional({ enum: NoticeImportance }) @IsOptional() @IsEnum(NoticeImportance) importance?: NoticeImportance;
  override get searchFields(): (keyof Notice)[] { return ['title', 'content']; }
}

@ApiSchema({ name: 'NoticeCursorResponse' })
export class NoticeCursorResponseDto extends CursorResponseDto<NoticeItemDto> {
  @ApiProperty({ type: [NoticeItemDto] }) @Type(() => NoticeItemDto) items!: NoticeItemDto[];
}
