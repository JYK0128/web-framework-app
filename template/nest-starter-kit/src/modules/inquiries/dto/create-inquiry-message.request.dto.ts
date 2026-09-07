import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { INQUIRY_MESSAGE_MAX_LENGTH } from '#/common/configs/communication.config';
import { DtoType } from '#/common/dto/entity-dto';
import { InquiryMessage } from '#/entities/inquiries/inquiry-message.entity';

export class CreateInquiryMessageRequestDto extends DtoType(InquiryMessage) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(INQUIRY_MESSAGE_MAX_LENGTH)
  override content!: string;
}
