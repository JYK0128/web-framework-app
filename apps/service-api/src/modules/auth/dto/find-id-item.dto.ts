import { ApiProperty } from '@nestjs/swagger';

export class FindIdItemDto {
  @ApiProperty({ type: String })
  maskedEmail!: string;

  @ApiProperty({ type: String })
  provider!: string;
}
