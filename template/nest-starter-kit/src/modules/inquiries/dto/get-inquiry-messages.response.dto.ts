import { ApiProperty } from '@nestjs/swagger';

import { ListResponseDto } from '#/common/interfaces';

import { InquiryMessageItemDto } from './inquiry-message-item.dto';

export class GetInquiryMessagesResponseDto extends ListResponseDto<InquiryMessageItemDto> {
  @ApiProperty({ type: () => [InquiryMessageItemDto] })
  override items!: InquiryMessageItemDto[];
}
