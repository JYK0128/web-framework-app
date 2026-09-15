import { ApiProperty, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';

import { ListResponseDto } from '#/common/interfaces';

import { InquiryMessageDto } from './inquiry-message.dto';

@ApiSchema({ name: 'GetAdminInquiryMessagesResponseDto' })
export class GetAdminInquiryMessagesResponseDto extends ListResponseDto<InquiryMessageDto> {
  @ApiProperty({ type: () => [InquiryMessageDto] })
  @Type(() => InquiryMessageDto)
  override items!: InquiryMessageDto[];
}
