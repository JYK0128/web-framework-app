import { ApiProperty } from '@nestjs/swagger';

import { InquiryMessageItemDto } from './inquiry-message-item.dto';

export class GetInquiryMessagesResponseDto {
  @ApiProperty({ type: () => [InquiryMessageItemDto] })
  items!: InquiryMessageItemDto[];
}
