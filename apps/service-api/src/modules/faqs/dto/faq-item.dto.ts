import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { EntityDto } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

@ApiSchema({ name: 'FaqItem' })
export class FaqItemDto extends EntityDto(Faq) {
  @ApiProperty({ type: String }) override id!: string;
  @ApiProperty({ type: String }) override category!: string;
  @ApiProperty({ type: String }) override question!: string;
  @ApiProperty({ type: String }) override answer!: string;
  @ApiProperty({ type: Number }) override sortOrder!: number;
  @ApiProperty({ type: Boolean }) override isPublished!: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) override createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override updatedAt!: Date;
}
