import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class FaqItemDto extends DtoType(Faq) {
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

  @ApiProperty({ type: 'number' })
  override helpfulCount!: number;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt: Date;

  constructor(faq: Faq) {
    super();
    this.id = faq.id;
    this.category = faq.category;
    this.question = faq.question;
    this.answer = faq.answer;
    this.order = faq.order;
    this.isPublished = faq.isPublished;
    this.helpfulCount = faq.helpfulCount;
    this.createdAt = faq.createdAt;
    this.updatedAt = faq.updatedAt;
  }
}
