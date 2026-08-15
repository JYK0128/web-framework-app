import { ApiProperty } from '@nestjs/swagger';

import type { Faq } from '#/entities/faqs/faq.entity';

export class FaqItemDto {
  @ApiProperty({ example: 'faq-123' })
  id: string;

  @ApiProperty({ example: '계정/인증' })
  category: string;

  @ApiProperty({ example: '비밀번호를 분실했습니다. 어떻게 찾나요?' })
  question: string;

  @ApiProperty({ example: '로그인 화면의 [비밀번호 찾기]를 통해 등록된 이메일로 재설정 링크를 받으실 수 있습니다.' })
  answer: string;

  @ApiProperty({ example: 0 })
  order: number;

  @ApiProperty({ example: true })
  isPublished: boolean;

  @ApiProperty({ example: 5 })
  helpfulCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;

  constructor(faq: Faq) {
    this.id = faq.id;
    this.category = faq.category;
    this.question = faq.question;
    this.answer = faq.answer;
    this.order = faq.order;
    this.isPublished = faq.isPublished;
    this.helpfulCount = faq.helpfulCount;
    this.createdAt = faq.createdAt.toISOString();
    this.updatedAt = faq.updatedAt.toISOString();
  }
}
