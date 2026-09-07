import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { INQUIRY_MESSAGE_MAX_LENGTH } from '#/common/configs/communication.config';
import { DtoType } from '#/common/dto/entity-dto';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';

export class CreateInquiryRequestDto extends DtoType(Inquiry) {
  @ApiProperty({ type: 'string', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override category!: string;

  @ApiProperty({ type: 'string', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override title!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(INQUIRY_MESSAGE_MAX_LENGTH)
  override content!: string;
}
