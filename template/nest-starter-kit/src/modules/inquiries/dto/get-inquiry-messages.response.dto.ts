import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { InquiryMessageDto } from './inquiry-message.dto';

export class GetInquiryMessagesResponseDto extends ListResponseDto<InquiryMessageDto> {
  @ApiProperty({ type: () => [InquiryMessageDto] })
  @Type(() => InquiryMessageDto)
  override items!: InquiryMessageDto[];
}
