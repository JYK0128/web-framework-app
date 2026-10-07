import { ApiProperty, ApiSchema } from '@nestjs/swagger';

import { EntityDto } from '#/common/interfaces/base/entity.dto';
import { Faq, FaqCategory } from '#/entities/faqs/faq.entity';

@ApiSchema({ name: 'FaqItem' })
export class FaqItemDto extends EntityDto(Faq) {
  @ApiProperty({ type: String }) override id!: string;
  @ApiProperty({ enum: FaqCategory }) override category!: FaqCategory;
  @ApiProperty({ type: String }) override question!: string;
  @ApiProperty({ type: String }) override answer!: string;
  @ApiProperty({ type: Number }) override sortOrder!: number;
  @ApiProperty({ type: Boolean }) override isPublished!: boolean;
  @ApiProperty({ type: String, format: 'date-time' }) override createdAt!: Date;
  @ApiProperty({ type: String, format: 'date-time' }) override updatedAt!: Date;

  static override from(faq: Faq): FaqItemDto {
    return this.fromPlain({
      id: faq.id,
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      isPublished: faq.isPublished,
      createdAt: faq.createdAt,
      updatedAt: faq.updatedAt,
    });
  }
}
