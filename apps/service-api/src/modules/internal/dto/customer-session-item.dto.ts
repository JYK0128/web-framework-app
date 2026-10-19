import { ApiProperty } from '@nestjs/swagger';

export class CustomerSessionItemDto {
  @ApiProperty()
  familyId!: string;

  @ApiProperty()
  rememberMe!: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}
