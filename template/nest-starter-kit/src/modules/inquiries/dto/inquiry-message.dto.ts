import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { Inquiry } from '#/entities/inquiries/inquiry.entity';
import { InquiryMessage, InquiryMessageAuthorRole } from '#/entities/inquiries/inquiry-message.entity';

type InquiryMessagePlain = InquiryMessage & { inquiryId?: string, authorId?: string, authorName?: string };

export class InquiryMessageDto extends EntityDto(InquiryMessage) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: InquiryMessagePlain }) => (obj.inquiry as Inquiry | { id: string })?.id ?? obj.inquiryId)
  inquiryId!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: InquiryMessagePlain }) => obj.author?.id ?? obj.authorId)
  authorId!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: InquiryMessagePlain }) => obj.author?.name ?? obj.authorName)
  authorName!: string;

  @ApiEnum({ enum: InquiryMessageAuthorRole })
  override authorRole!: InquiryMessageAuthorRole;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;
}
