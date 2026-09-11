import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { PageResponseDto } from '#/common/interfaces';

import { InquiryItemDto } from './inquiry-item.dto';

export class GetAdminInquiriesResponseDto extends PageResponseDto<InquiryItemDto> {
  @ApiProperty({ type: () => [InquiryItemDto] })
  @Type(() => InquiryItemDto)
  override items!: InquiryItemDto[];
}
