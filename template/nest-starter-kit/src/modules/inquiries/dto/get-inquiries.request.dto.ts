import type { ObjectQuery } from '@mikro-orm/core';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { PageRequestDto, SortDirection } from '#/common/interfaces';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';

export const INQUIRY_SORT = ['createdAt', 'updatedAt', 'status', 'title'] as const;
export type InquirySortKey = (typeof INQUIRY_SORT)[number];

export class GetInquiriesRequestDto extends PageRequestDto<Inquiry, InquirySortKey> {
  override get searchFields(): (keyof Inquiry)[] {
    return ['title', 'content'];
  }

  @ApiEnumOptional({ enum: InquiryStatus })
  @IsOptional()
  @IsEnum(InquiryStatus)
  status?: InquiryStatus;

  @ApiPropertyOptional({ description: '문의 카테고리 필터' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['createdAt'], isArray: true, enum: INQUIRY_SORT })
  @IsOptional()
  @IsIn(INQUIRY_SORT, { each: true })
  override sort: InquirySortKey[] = ['createdAt'];

  @ApiPropertyOptional({ example: ['desc'], isArray: true, enum: SortDirection })
  @IsOptional()
  @IsEnum(SortDirection, { each: true })
  override direction: SortDirection[] = ['desc'];

  override toFilterQuery(): ObjectQuery<Inquiry> {
    const filters: ObjectQuery<Inquiry> = {};
    if (this.status) filters.status = this.status;
    if (this.category) filters.category = this.category;

    const searchQuery = this.toSearchQuery();
    return searchQuery ? { $and: [filters, searchQuery] } : filters;
  }
}

export class GetAdminInquiriesRequestDto extends GetInquiriesRequestDto {
  @ApiPropertyOptional({ description: '검색어 (제목, 문의 내용, 회원명)' })
  override search?: string;

  @Type(() => Number)
  override page = 1;
}
