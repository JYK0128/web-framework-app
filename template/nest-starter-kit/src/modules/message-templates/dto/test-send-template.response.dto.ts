import { ApiProperty } from '@nestjs/swagger';

export class TestSendTemplateResponseDto {
  @ApiProperty({ type: 'boolean' })
  success!: boolean;

  @ApiProperty({ type: 'string' })
  message!: string;
}
