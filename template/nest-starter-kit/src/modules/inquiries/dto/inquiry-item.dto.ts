import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';

export class InquiryItemDto extends DtoType(Inquiry) {
  constructor(inquiry: Inquiry) {
    super();
    this.id = inquiry.id;
    this.userId = inquiry.user.id;
    this.userName = inquiry.user.name;
    this.category = inquiry.category;
    this.title = inquiry.title;
    this.content = inquiry.content;
    this.status = inquiry.status;
    this.createdAt = inquiry.createdAt;
    this.updatedAt = inquiry.updatedAt;
  }

  @ApiProperty()
  override id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  userName!: string;

  @ApiProperty({ example: '서비스 이용' })
  override category!: string;

  @ApiProperty({ example: '로그인이 되지 않습니다.' })
  override title!: string;

  @ApiProperty()
  override content!: string;

  @ApiEnum({ enum: InquiryStatus })
  override status!: InquiryStatus;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
