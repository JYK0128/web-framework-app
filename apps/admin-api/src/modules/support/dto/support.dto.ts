import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';

import { PageRequestDto } from '#/common/interfaces/request';
import { ListResponseDto, PageResponseDto } from '#/common/interfaces/response';
import type { BaseEntity } from '#/entities/common/base.entity';

export const SupportRoomStatus = { OPEN: 'open', IN_PROGRESS: 'in_progress', CLOSED: 'closed' } as const;
export type SupportRoomStatus = (typeof SupportRoomStatus)[keyof typeof SupportRoomStatus];
export const SupportMessageSenderType = { USER: 'user', AGENT: 'agent', SYSTEM: 'system' } as const;
export type SupportMessageSenderType = (typeof SupportMessageSenderType)[keyof typeof SupportMessageSenderType];

@ApiSchema({ name: 'SupportRoomItem' })
export class SupportRoomItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: SupportRoomStatus }) status!: SupportRoomStatus;
  @ApiProperty() userId!: string;
  @ApiProperty() userName!: string;
  @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastMessageAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

@ApiSchema({ name: 'SupportMessageItem' })
export class SupportMessageItemDto {
  @ApiProperty() id!: string;
  @ApiProperty() roomId!: string;
  @ApiPropertyOptional({ nullable: true }) senderUserId!: string | null;
  @ApiProperty() senderName!: string;
  @ApiProperty({ enum: SupportMessageSenderType }) senderType!: SupportMessageSenderType;
  @ApiProperty() content!: string;
  @ApiPropertyOptional({ nullable: true }) readAt!: Date | null;
  @ApiProperty() createdAt!: Date;
}

@ApiSchema({ name: 'SupportSocketTicket' })
export class SupportSocketTicketResponseDto {
  @ApiProperty() ticket!: string;
}

export class SupportMessageListResponseDto extends ListResponseDto<SupportMessageItemDto> { @ApiProperty({ type: [SupportMessageItemDto] }) @Type(() => SupportMessageItemDto) override items!: SupportMessageItemDto[]; }
export class SupportRoomPageResponseDto extends PageResponseDto<SupportRoomItemDto> { @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[]; }
export class GetSupportRoomsRequestDto extends PageRequestDto<BaseEntity, 'lastMessageAt' | 'createdAt' | 'updatedAt' | 'id'> {
  @ApiPropertyOptional({ isArray: true, enum: ['lastMessageAt', 'createdAt', 'updatedAt', 'id'] })
  @IsIn(['lastMessageAt', 'createdAt', 'updatedAt', 'id'], { each: true })
  override sort: ('lastMessageAt' | 'createdAt' | 'updatedAt' | 'id')[] = ['lastMessageAt', 'createdAt'];

  override direction = ['desc' as const, 'desc' as const];

  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}
export class CreateSupportMessageRequestDto { @ApiProperty() @IsString() content!: string; }
export class UpdateSupportRoomRequestDto { @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus; }
