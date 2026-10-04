import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { PAGINATION_DEFAULT_LIMIT, PAGINATION_DEFAULT_PAGE, PAGINATION_MAX_LIMIT } from '#/app.config';
import { ToNumber } from '#/common/decorators/to-number.decorator';
import { ListResponseDto, PageResponseDto } from '#/common/interfaces/response';
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

export class GetSupportRoomsRequestDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ default: PAGINATION_DEFAULT_PAGE }) @IsOptional() @ToNumber() @Min(1) page = PAGINATION_DEFAULT_PAGE;
  @ApiPropertyOptional({ maximum: PAGINATION_MAX_LIMIT, default: PAGINATION_DEFAULT_LIMIT }) @IsOptional() @ToNumber() @Min(1) @Max(PAGINATION_MAX_LIMIT) limit = PAGINATION_DEFAULT_LIMIT;
  @ApiPropertyOptional({ enum: SupportRoomStatus }) @IsOptional() @IsEnum(SupportRoomStatus) status?: SupportRoomStatus;
}

export class SupportRoomPageResponseDto extends PageResponseDto<SupportRoomItemDto> {
  @ApiProperty({ type: [SupportRoomItemDto] }) @Type(() => SupportRoomItemDto) override items!: SupportRoomItemDto[];
}
