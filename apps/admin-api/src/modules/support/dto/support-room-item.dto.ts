import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { BaseDto } from '#/core/http/dto/base/base.dto';
import { SupportRoomStatus } from '#/modules/support/dto/support.constants';

@ApiSchema({ name: 'SupportRoomItem' })
export class SupportRoomItemDto extends BaseDto {
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
