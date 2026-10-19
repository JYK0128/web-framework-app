import { ApiProperty } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class FaqItemDto extends EntityDto(Faq) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  override category!: string;

  @ApiProperty({ type: 'string' })
  override question!: string;

  @ApiProperty({ type: 'string' })
  override answer!: string;

  @ApiProperty({ type: 'number' })
  override order!: number;

  @ApiProperty({ type: 'boolean' })
  override isPublished!: boolean;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
