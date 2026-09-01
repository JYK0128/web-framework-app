import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { InquiryMessage } from '#/entities/inquiries/inquiry-message.entity';

export class CreateInquiryMessageRequestDto extends DtoType(InquiryMessage) {
  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  override content!: string;
}
