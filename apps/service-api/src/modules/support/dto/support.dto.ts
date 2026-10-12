import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { ApplicationError } from '@pkg/shared/common';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { User } from '#/core/database/entities/auth';
import { SupportMessage, SupportMessageSenderType, SupportRoom, SupportRoomStatus } from '#/core/database/entities/support';
import { EntityDto } from '#/core/http/dto/base/entity.dto';
import { CursorRequestDto, PageRequestDto } from '#/core/http/dto/request';
import { CursorResponseDto, ListResponseDto, PageResponseDto } from '#/core/http/dto/response';

@ApiSchema({ name: 'SupportRoomItem' })
export class SupportRoomItemDto extends EntityDto(SupportRoom) {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: SupportRoomStatus }) status!: SupportRoomStatus;
  @ApiProperty() userId!: string;
  @ApiProperty() userName!: string;
  @ApiPropertyOptional({ nullable: true }) assigneeName!: string | null;
  @ApiPropertyOptional({ nullable: true }) lastMessageAt!: Date | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;

  static override parseEntity(room: SupportRoom): SupportRoomItemDto {
    const user = room.user as User | string;
    const assignee = room.assignee as User | string | null | undefined;
    const userProfile = typeof user === 'string' ? undefined : user.profile;
    const assigneeProfile = typeof assignee === 'object' && assignee ? assignee.profile : undefined;
    if (typeof user !== 'string' && !userProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    if (typeof assignee === 'object' && assignee && !assigneeProfile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
    return this.parse({
      id: room.id,
      title: room.title,
      status: room.status,
      userId: typeof user === 'string' ? user : user.id,
      userName: userProfile?.name ?? '',
      assigneeName: assigneeProfile?.name ?? null,
      lastMessageAt: room.lastMessageAt ?? null,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    });
  }
}

@ApiSchema({ name: 'SupportMessageItem' })
export class SupportMessageItemDto extends EntityDto(SupportMessage) {
  @ApiProperty() id!: string;
  @ApiProperty() roomId!: string;
  @ApiPropertyOptional({ nullable: true }) senderUserId!: string | null;
  @ApiProperty() senderName!: string;
  @ApiProperty({ enum: SupportMessageSenderType }) senderType!: SupportMessageSenderType;
  @ApiProperty() content!: string;
  @ApiPropertyOptional({ nullable: true }) readAt!: Date | null;
  @ApiProperty() createdAt!: Date;

  static override parseEntity(message: SupportMessage): SupportMessageItemDto {
    const room = message.room as SupportRoom | string;
    const sender = message.senderUser as User | string | null | undefined;
    let senderName = message.senderType === SupportMessageSenderType.AGENT ? '상담원' : '시스템';
    if (typeof sender === 'object' && sender) {
      if (!sender.profile) throw new ApplicationError({ code: 'USER_PROFILE_NOT_FOUND', status: HttpStatus.INTERNAL_SERVER_ERROR });
      senderName = sender.profile.name;
    }
    return this.parse({
      id: message.id,
      roomId: typeof room === 'string' ? room : room.id,
      senderUserId: typeof sender === 'string' ? sender : sender?.id ?? null,
      senderName,
      senderType: message.senderType,
      content: message.content,
      readAt: message.readAt ?? null,
      createdAt: message.createdAt,
    });
  }
}

@ApiSchema({ name: 'SupportSocketTicket' })
export class SupportSocketTicketResponseDto {
  @ApiProperty() ticket!: string;
}

export class SupportMessageListResponseDto extends ListResponseDto<SupportMessageItemDto> {
  @ApiProperty({ type: [SupportMessageItemDto] }) @Type(() => SupportMessageItemDto) override items!: SupportMessageItemDto[];
}

export class CreateSupportRoomRequestDto {
  @ApiProperty({ maxLength: 5000 }) @IsString() @IsNotEmpty() @MaxLength(5000) content!: string;
}

export class CreateSupportMessageRequestDto {
  @ApiProperty({ maxLength: 5000 }) @IsString() @IsNotEmpty() @MaxLength(5000) content!: string;
}

export class UpdateSupportRoomRequestDto {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}

export class GetSupportRoomsRequestDto extends PageRequestDto<SupportRoom, 'lastMessageAt' | 'createdAt' | 'updatedAt' | 'id'> {
  @ApiPropertyOptional({ isArray: true, enum: ['lastMessageAt', 'createdAt', 'updatedAt', 'id'] })
  @IsIn(['lastMessageAt', 'createdAt', 'updatedAt', 'id'], { each: true })
  override sort: ('lastMessageAt' | 'createdAt' | 'updatedAt' | 'id')[] = ['lastMessageAt', 'createdAt'];

  override direction = ['desc' as const, 'desc' as const];

  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}

export class SupportRoomPageResponseDto extends PageResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[];
}

export class GetSupportRoomsCursorRequestDto extends CursorRequestDto<SupportRoom, 'createdAt' | 'id'> {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
  @ApiPropertyOptional({ isArray: true, enum: ['createdAt', 'id'] })
  @IsIn(['createdAt', 'id'], { each: true })
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];

  override direction = ['desc' as const, 'desc' as const];
}

export class SupportRoomCursorResponseDto extends CursorResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[];
}
