import { ApiProperty } from '@nestjs/swagger';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { DtoType } from '#/common/dto/entity-dto';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';

export class InquiryMessageItemDto extends DtoType(InquiryMessage) {
  constructor(message: InquiryMessage) {
    super();
    this.id = message.id;
    this.inquiryId = message.inquiry.id;
    this.authorId = message.author.id;
    this.authorName = message.author.name;
    this.authorRole = message.authorRole;
    this.content = message.content;
    this.createdAt = message.createdAt;
  }

  @ApiProperty()
  override id!: string;

  @ApiProperty()
  inquiryId!: string;

  @ApiProperty()
  authorId!: string;

  @ApiProperty()
  authorName!: string;

  @ApiEnum({ enum: InquiryMessageAuthorRole })
  override authorRole!: InquiryMessageAuthorRole;

  @ApiProperty()
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;
}
