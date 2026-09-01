import { ApiProperty } from '@nestjs/swagger';

import { PageResponseDto } from '#/common/interfaces';

import { InquiryItemDto } from './inquiry-item.dto';

export class GetAdminInquiriesResponseDto extends PageResponseDto<InquiryItemDto> {
  @ApiProperty({ type: () => [InquiryItemDto] })
  override items!: InquiryItemDto[];
}
