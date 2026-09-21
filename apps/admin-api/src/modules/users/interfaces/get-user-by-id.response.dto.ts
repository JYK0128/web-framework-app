import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { UserItemDto } from './user-item.dto';

export class GetUserByIdResponseDto extends UserItemDto {
  @ApiProperty({ type: [String] })
  providers!: string[];

  @ApiProperty()
  hasPassword!: boolean;

  @ApiPropertyOptional({ type: Date, nullable: true })
  passwordUpdatedAt!: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastLoginAt!: Date | null;
}
