import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';

import { OperatorItemDto } from './operator-item.dto';

@ApiSchema({ name: 'OperatorDetailResponse' })
export class GetOperatorByIdResponseDto extends OperatorItemDto {
  @ApiProperty({ type: [String] })
  providers!: string[];

  @ApiProperty()
  hasPassword!: boolean;

  @ApiPropertyOptional({ type: Date, nullable: true })
  passwordUpdatedAt!: Date | null;

  @ApiPropertyOptional({ type: Date, nullable: true })
  lastLoginAt!: Date | null;
}
