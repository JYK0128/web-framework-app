import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

import { ApiEnum } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { SupportTicket, SupportTicketPriority, SupportTicketStatus } from '#/entities/support/support-ticket.entity';

type SupportTicketPlain = SupportTicket & {
  userId?: string
  userName?: string
  assigneeId?: string | null
  assigneeName?: string | null
};

export class SupportTicketItemDto extends EntityDto(SupportTicket) {
  @ApiProperty({ type: 'string' })
  override id!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: SupportTicketPlain }) => obj.user?.id ?? obj.userId)
  userId!: string;

  @ApiProperty({ type: 'string' })
  @Transform(({ obj }: { obj: SupportTicketPlain }) => obj.user?.name ?? obj.userName)
  userName!: string;

  @ApiProperty({ type: 'string', nullable: true })
  @Transform(({ obj }: { obj: SupportTicketPlain }) => obj.assignee?.id ?? obj.assigneeId ?? null)
  assigneeId!: string | null;

  @ApiProperty({ type: 'string', nullable: true })
  @Transform(({ obj }: { obj: SupportTicketPlain }) => obj.assignee?.name ?? obj.assigneeName ?? null)
  assigneeName!: string | null;

  @ApiProperty({ type: 'string' })
  override category!: string;

  @ApiProperty({ type: 'string' })
  override title!: string;

  @ApiProperty({ type: 'string' })
  override content!: string;

  @ApiEnum({ enum: SupportTicketPriority })
  override priority!: SupportTicketPriority;

  @ApiEnum({ enum: SupportTicketStatus })
  override status!: SupportTicketStatus;

  @ApiProperty({ type: 'string', nullable: true })
  override resolution!: string | null;

  @ApiProperty({ type: Date, format: 'date-time' })
  override createdAt!: Date;

  @ApiProperty({ type: Date, format: 'date-time' })
  override updatedAt!: Date;
}
