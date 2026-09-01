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
    this.assigneeId = inquiry.assignee?.id ?? null;
    this.assigneeName = inquiry.assignee?.name ?? inquiry.assignee?.email ?? null;
    this.category = inquiry.category;
    this.title = inquiry.title;
    this.content = inquiry.content;
    this.status = inquiry.status;
    this.createdAt = inquiry.createdAt;
    this.updatedAt = inquiry.updatedAt;
  }

  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  userId!: string;

  @ApiProperty({ type: 'string' })
  userName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  assigneeId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  assigneeName!: string | null;

  @ApiProperty({ type: 'string' })
  override category!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiEnum({ enum: InquiryStatus })
  override status!: InquiryStatus;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
