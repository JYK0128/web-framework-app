import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { Inquiry, InquiryStatus } from '#/entities/inquiries/inquiry.entity';

type InquiryPlain = Inquiry & { userId?: string, userName?: string, assigneeId?: string | null, assigneeName?: string | null };

export class InquiryItemDto extends EntityDto(Inquiry) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: InquiryPlain }) => obj.user?.id ?? obj.userId)
  userId!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: InquiryPlain }) => obj.user?.name ?? obj.userName)
  userName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  @Transform(({ obj }: { obj: InquiryPlain }) => obj.assignee?.id ?? obj.assigneeId ?? null)
  assigneeId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  @Transform(({ obj }: { obj: InquiryPlain }) => obj.assignee?.name ?? obj.assigneeName ?? null)
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
