import { ApiProperty } from '@nestjs/swagger';

import { DtoType } from '#/common/dto/entity-dto';
import { Faq } from '#/entities/faqs/faq.entity';

export class FaqItemDto extends DtoType(Faq) {
  @ApiProperty({ example: 'faq-123' })
  override id!: string;

  @ApiProperty({ example: '계정/인증' })
  override category!: string;

  @ApiProperty({ example: '비밀번호를 분실했습니다. 어떻게 찾나요?' })
  override question!: string;

  @ApiProperty({ example: '로그인 화면의 [비밀번호 찾기]를 통해 등록된 이메일로 재설정 링크를 받으실 수 있습니다.' })
  override answer!: string;

  @ApiProperty({ example: 0 })
  override order!: number;

  @ApiProperty({ example: true })
  override isPublished!: boolean;

  @ApiProperty({ example: 5 })
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
