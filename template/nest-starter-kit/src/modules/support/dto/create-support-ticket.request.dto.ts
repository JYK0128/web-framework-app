import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { ApiEnumOptional } from '#/common/decorators/api-enum.decorator';
import { EntityDto } from '#/common/dto/entity-dto';
import { SupportTicket, SupportTicketPriority } from '#/entities/support/support-ticket.entity';

export class CreateSupportTicketRequestDto extends EntityDto(SupportTicket) {
  @ApiProperty({ type: 'string', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  override category!: string;

  @ApiProperty({ type: 'string', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  override title!: string;

  @ApiProperty({ type: 'string' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  override content!: string;

  @ApiEnumOptional({ enum: SupportTicketPriority, default: SupportTicketPriority.NORMAL })
  @IsOptional()
  @IsEnum(SupportTicketPriority)
  override priority?: SupportTicketPriority;
}
