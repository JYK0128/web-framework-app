import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { InquiryMessage } from '#/entities/inquiries/inquiry-message.entity';

export class GetInquiryMessagesRequestDto extends EntityDto(InquiryMessage) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
