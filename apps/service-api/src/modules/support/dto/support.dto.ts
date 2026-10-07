import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { CursorRequestDto, PageRequestDto } from '#/common/interfaces/request';
import { CursorResponseDto, ListResponseDto, PageResponseDto } from '#/common/interfaces/response';
import { SupportMessageSenderType } from '#/entities/support/support-message.entity';
import { SupportRoom, SupportRoomStatus } from '#/entities/support/support-room.entity';

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

export class GetSupportRoomsRequestDto extends PageRequestDto<SupportRoom> {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}

export class SupportRoomPageResponseDto extends PageResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[];
}

export class GetSupportRoomsCursorRequestDto extends CursorRequestDto<SupportRoom, 'createdAt' | 'id'> {
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
  override sort: ('createdAt' | 'id')[] = ['createdAt', 'id'];
  override direction = ['desc' as const, 'desc' as const];
}

export class SupportRoomCursorResponseDto extends CursorResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[];
}
