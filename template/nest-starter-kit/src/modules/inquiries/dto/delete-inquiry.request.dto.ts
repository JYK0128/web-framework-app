import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { DtoType } from '#/common/dto/entity-dto';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';

export class DeleteInquiryRequestDto extends DtoType(Inquiry) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
