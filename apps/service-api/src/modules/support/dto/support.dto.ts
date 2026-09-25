import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { ToNumber } from '#/common/decorators/to-number.decorator';
import { SupportMessageSenderType } from '#/entities/support/support-message.entity';
import { SupportRoomStatus } from '#/entities/support/support-room.entity';

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

export class SupportMessageListResponseDto {
  @ApiProperty({ type: [SupportMessageItemDto] }) items!: SupportMessageItemDto[];
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

export class GetSupportRoomsRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional() @IsOptional() @ToNumber() @Min(1) page = 1;
  @ApiPropertyOptional() @IsOptional() @ToNumber() @Min(1) @Max(100) limit = 20;
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}

export class SupportRoomListResponseDto {
  @ApiProperty({ type: [SupportRoomItemDto] }) items!: SupportRoomItemDto[];
  @ApiProperty() page!: number;
  @ApiProperty() totalPages!: number;
  @ApiProperty() hasNextPage!: boolean;
  @ApiProperty() hasPrevPage!: boolean;
  @ApiProperty() totalCount!: number;
}
