import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

import { EntityDto } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class DeleteFaqRequestDto extends EntityDto(Faq) {
  @ApiProperty({ type: 'string' })
  @IsString()
  override id!: string;
}
