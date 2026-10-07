import { IsEnum, IsOptional } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { SupportTicket, SupportTicketStatus } from '#/entities/support/support-ticket.entity';

export class UpdateSupportTicketRequestDto extends EntityDto(SupportTicket) {
  @ApiEnumOptional({ enum: SupportTicketStatus })
  @IsOptional()
  @IsEnum(SupportTicketStatus)
  override status?: SupportTicketStatus;
}
