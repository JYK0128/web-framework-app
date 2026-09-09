import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';

export class GetInquiryRequestDto extends EntityDto(Inquiry) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
