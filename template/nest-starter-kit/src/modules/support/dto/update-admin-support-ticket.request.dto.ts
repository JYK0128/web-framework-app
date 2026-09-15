import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { SupportTicket, SupportTicketPriority, SupportTicketStatus } from '#/entities/support/support-ticket.entity';

export class UpdateAdminSupportTicketRequestDto extends EntityDto(SupportTicket) {
  @ApiPropertyOptional({ type: 'string', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  override category?: string;

  @ApiPropertyOptional({ type: 'string', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  override title?: string;

  @ApiPropertyOptional({ type: 'string' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  override content?: string;

  @ApiEnumOptional({ enum: SupportTicketPriority })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  override priority?: SupportTicketPriority;

  @ApiEnumOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  override status?: SupportTicketStatus;

  @ApiPropertyOptional({ type: 'string', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  override resolution?: string | null;

  @ApiPropertyOptional({ type: 'string', nullable: true, description: '담당자 사용자 ID. null이면 담당자를 해제합니다.' })
  @IsOptional()
  @IsString()
  assigneeId?: string | null;
}
